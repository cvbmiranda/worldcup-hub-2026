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
    Gera a árvore completa do mata-mata (31 partidas desde 16-avos até a Final).
    """
    calculate_group_positions()

    winners = list(Standing.objects.filter(position=1).order_by('-points', '-goal_diff', '-goals_for'))
    runners_up = list(Standing.objects.filter(position=2).order_by('-points', '-goal_diff', '-goals_for'))
    top_8_thirds, _ = get_best_third_placed_teams()

    if len(winners) != 12 or len(runners_up) != 12 or len(top_8_thirds) != 8:
        raise ValueError("Dados insuficientes para gerar a fase de mata-mata. Faltam times nas classificações.")

    # Limpar qualquer jogo de mata-mata e paths anteriores
    from .models import KnockoutPath
    Match.objects.filter(stage__in=[
        Match.Stage.ROUND_32, Match.Stage.ROUND_16, Match.Stage.QUARTER,
        Match.Stage.SEMI, Match.Stage.FINAL
    ]).delete()
    KnockoutPath.objects.all().delete()

    from django.utils import timezone
    now = timezone.now()

    # --- 1. Criar os 16 jogos do ROUND_32 ---
    r32_matches = []
    
    # 8 Winners vs 8 Thirds
    for i in range(8):
        m = Match(team1=winners[i].team, team2=top_8_thirds[7 - i].team, stage=Match.Stage.ROUND_32, match_date_utc=now)
        m.save()
        r32_matches.append(m)
        
    # 4 Winners vs 4 Piores Runners-up
    for i in range(4):
        m = Match(team1=winners[8 + i].team, team2=runners_up[11 - i].team, stage=Match.Stage.ROUND_32, match_date_utc=now)
        m.save()
        r32_matches.append(m)
        
    # 8 Runners-up vs 8 Runners-up
    for i in range(4):
        m = Match(team1=runners_up[i].team, team2=runners_up[7 - i].team, stage=Match.Stage.ROUND_32, match_date_utc=now)
        m.save()
        r32_matches.append(m)

    # Função auxiliar para gerar a próxima fase
    def create_next_round(prev_matches, stage):
        next_matches = []
        # Agrupa os jogos anteriores de 2 em 2 para formar 1 novo jogo
        for i in range(0, len(prev_matches), 2):
            m = Match(stage=stage, match_date_utc=now)
            m.save()
            next_matches.append(m)
            
            # Criar os KnockoutPaths ligando as duas partidas prévias a esta
            KnockoutPath.objects.create(match=prev_matches[i], next_match=m)
            if i + 1 < len(prev_matches):
                KnockoutPath.objects.create(match=prev_matches[i+1], next_match=m)
        return next_matches

    # --- 2. Construir a árvore ROUND_16 -> QUARTER -> SEMI -> FINAL ---
    r16_matches = create_next_round(r32_matches, Match.Stage.ROUND_16)
    qf_matches = create_next_round(r16_matches, Match.Stage.QUARTER)
    sf_matches = create_next_round(qf_matches, Match.Stage.SEMI)
    final_match = create_next_round(sf_matches, Match.Stage.FINAL)

    return Match.objects.filter(stage=Match.Stage.ROUND_32)

def simulate_knockout_stage():
    """
    Preenche resultados aleatórios para todos os jogos do mata-mata, 
    avançando os vencedores automaticamente até a Grande Final.
    """
    stages = [
        Match.Stage.ROUND_32,
        Match.Stage.ROUND_16,
        Match.Stage.QUARTER,
        Match.Stage.SEMI,
        Match.Stage.FINAL
    ]
    for stage in stages:
        matches = Match.objects.filter(stage=stage).order_by('id')
        for match in matches:
            if not match.team1 or not match.team2:
                continue
            match.score1 = random.randint(0, 4)
            match.score2 = random.randint(0, 4)
            if match.score1 == match.score2:
                match.penalties_score1 = random.randint(3, 5)
                match.penalties_score2 = random.randint(0, 5)
                while match.penalties_score1 == match.penalties_score2:
                    match.penalties_score1 = random.randint(3, 5)
                    match.penalties_score2 = random.randint(0, 5)
            match.played = True
            match.save()
            
            winner = match.get_winner()
            if winner and hasattr(match, 'knockout') and match.knockout.next_match:
                next_match = match.knockout.next_match
                if next_match.team1 is None:
                    next_match.team1 = winner
                elif next_match.team2 is None:
                    next_match.team2 = winner
                else:
                    prev_matches = list(next_match.previous_matches.all().order_by('id'))
                    if len(prev_matches) > 0 and prev_matches[0].match.id == match.id:
                        next_match.team1 = winner
                    elif len(prev_matches) > 1 and prev_matches[1].match.id == match.id:
                        next_match.team2 = winner
                next_match.save()