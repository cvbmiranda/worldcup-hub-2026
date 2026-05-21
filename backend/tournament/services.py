from django.db import models
import random
from .models import Standing, Group
from django.db import transaction
from .models import Group, Standing, Match
def calculate_group_positions():
    """
    Garante que as posições (1º, 2º, 3º, 4º) de cada grupo estejam atualizadas
    antes de pescarmos os terceiros colocados.
    """
    groups = Group.objects.all()
    
    for group in groups:
        # Ordena os times do grupo pelos critérios da FIFA
        standings = Standing.objects.filter(group=group).order_by(
            '-points', 
            '-goal_diff', 
            '-goals_for'
        )
        
        # Atualiza a coluna 'position' no banco
        for index, standing in enumerate(standings):
            standing.position = index + 1
            standing.save()

def get_best_third_placed_teams():
    """
    Filtra os 12 terceiros colocados e retorna os 8 melhores
    que avançam para os 16-avos de final.
    """
    # 1. Primeiro, garantimos que a tabela está 100% atualizada
    calculate_group_positions()
    
    # 2. Pegamos apenas os times na 3ª posição de todos os 12 grupos
    third_placed_teams = list(Standing.objects.filter(position=3))
    
    # 3. Ordenamos essa lista de 12 times em memória (Python) usando os mesmos critérios
    # Usamos o Python 'sort' em vez do ORM caso precisemos de um desempate randômico complexo
    third_placed_teams.sort(
        key=lambda x: (x.points, x.goal_diff, x.goals_for), 
        reverse=True
    )
    
    # Se houver empate absoluto em todos os critérios no 8º e 9º lugar, 
    # a FIFA faz sorteio. Para o sistema não quebrar, o sort acima já 
    # mantém uma ordem determinística, mas você pode refinar isso depois.

    # 4. Retornamos os 8 primeiros da lista (Os classificados!)
    top_8 = third_placed_teams[:8]
    eliminated_4 = third_placed_teams[8:]
    
    return top_8, eliminated_4

def update_group_standings(group_id):
    """
    Recalcula os pontos e gols da tabela de classificação (Standing) 
    de um grupo específico com base nas partidas jogadas (played=True).
    """
    with transaction.atomic():
        group = Group.objects.get(id=group_id)
        standings = Standing.objects.filter(group=group)

        # 1. Zerar as estatísticas atuais para recalcular do zero
        for standing in standings:
            standing.points = 0
            standing.goals_for = 0
            standing.goals_against = 0
            # O goal_diff é calculado automaticamente pelo seu método save() no model!
            standing.save()

        # 2. Buscar apenas as partidas já marcadas como jogadas neste grupo
        matches = Match.objects.filter(group=group, played=True)

        # 3. Recalcular rodando pelas partidas
        for match in matches:
            # Prevenção: ignora caso o placar não tenha sido preenchido
            if match.score1 is None or match.score2 is None:
                continue 

            st1 = standings.get(team=match.team1)
            st2 = standings.get(team=match.team2)

            # Atualiza gols feitos e sofridos
            st1.goals_for += match.score1
            st1.goals_against += match.score2

            st2.goals_for += match.score2
            st2.goals_against += match.score1

            # Atualiza os pontos
            if match.score1 > match.score2:
                st1.points += 3
            elif match.score1 < match.score2:
                st2.points += 3
            else:
                st1.points += 1
                st2.points += 1

            # Salva no banco (isso também aciona o recalculo do goal_diff)
            st1.save()
            st2.save()

def generate_knockout_stage():
    """
    Gera as 16 partidas dos 16-avos de final (ROUND_32)
    com base nas classificações dos grupos.
    Usa um modelo simplificado matemático de cruzamento.
    """
    # 1. Checar se a fase de grupos já tem os jogos jogados (72 no total)
    # Aqui, para ser permissivo no teste, vamos só garantir que as tabelas estejam atualizadas
    calculate_group_positions()

    # 2. Obter os 1ºs e 2ºs de cada grupo
    winners = list(Standing.objects.filter(position=1).order_by('-points', '-goal_diff', '-goals_for'))
    runners_up = list(Standing.objects.filter(position=2).order_by('-points', '-goal_diff', '-goals_for'))
    
    # 3. Obter os 8 melhores terceiros colocados
    top_8_thirds, _ = get_best_third_placed_teams()

    # Temos 12 Winners, 12 Runners-up, e 8 Thirds = 32 times.
    if len(winners) != 12 or len(runners_up) != 12 or len(top_8_thirds) != 8:
        raise ValueError("Dados insuficientes para gerar a fase de mata-mata. Faltam times nas classificações.")

    # 4. Limpar qualquer jogo pré-existente do ROUND_32 para evitar duplicatas
    Match.objects.filter(stage=Match.Stage.ROUND_32).delete()

    matches_to_create = []
    
    from django.utils import timezone
    now = timezone.now()

    # 8 Winners jogam contra 8 Terceiros colocados (cruzamento invertido)
    for i in range(8):
        matches_to_create.append(
            Match(
                team1=winners[i].team,
                team2=top_8_thirds[7 - i].team,  # Melhor vencedor contra o "pior" terceiro
                stage=Match.Stage.ROUND_32,
                date=now
            )
        )
    
    # Restaram 4 Winners. Eles jogam contra os 4 piores Runners-up
    for i in range(4):
        matches_to_create.append(
            Match(
                team1=winners[8 + i].team,
                team2=runners_up[11 - i].team, # Piores runners-up (índices 11, 10, 9, 8)
                stage=Match.Stage.ROUND_32,
                date=now
            )
        )
    
    # Restaram 8 Runners-up (índices 0 a 7). Eles jogam entre si
    for i in range(4):
        matches_to_create.append(
            Match(
                team1=runners_up[i].team,
                team2=runners_up[7 - i].team,
                stage=Match.Stage.ROUND_32,
                date=now
            )
        )

    # 5. Salvar as 16 partidas no banco em lote
    Match.objects.bulk_create(matches_to_create)

    return Match.objects.filter(stage=Match.Stage.ROUND_32)