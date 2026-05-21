from django.core.management.base import BaseCommand
from tournament.models import Tournament, Group, Team, Match, Standing
from django.utils import timezone
from datetime import datetime, timedelta
import itertools

class Command(BaseCommand):
    help = 'Popula a base de dados com os grupos da Copa de 2026, tabelas de classificação e gera os 72 jogos da fase de grupos.'

    def handle(self, *args, **kwargs):
        self.stdout.write("A limpar dados antigos na base de dados...")
        Match.objects.all().delete()
        Standing.objects.all().delete()
        Team.objects.all().delete()
        Group.objects.all().delete()
        Tournament.objects.all().delete()

        self.stdout.write("A iniciar o seed oficial...")

        tournament = Tournament.objects.create(name="WorldCup Hub", year=2026)

        # Grupos OFICIAIS 
        groups_data = {
            'A': [('México', 'MX', 85.0), ('África do Sul', 'ZA', 70.0), ('Coreia do Sul', 'KR', 78.0), ('Rep. Tcheca', 'CZ', 77.0)],
            'B': [('Canadá', 'CA', 76.0), ('Bósnia', 'BA', 73.0), ('Qatar', 'QA', 68.0), ('Suíça', 'CH', 81.0)],
            'C': [('Brasil', 'BR', 92.0), ('Marrocos', 'MA', 83.0), ('Haiti', 'HT', 60.0), ('Escócia', 'GB-SCT', 76.0)],
            'D': [('EUA', 'US', 80.0), ('Paraguai', 'PY', 75.0), ('Austrália', 'AU', 74.0), ('Turquia', 'TR', 78.0)],
            'E': [('Alemanha', 'DE', 88.0), ('Curaçao', 'CW', 65.0), ('Costa do Marfim', 'CI', 75.0), ('Equador', 'EC', 78.0)],
            'F': [('Holanda', 'NL', 87.0), ('Japão', 'JP', 81.0), ('Suécia', 'SE', 80.0), ('Tunísia', 'TN', 72.0)],
            'G': [('Bélgica', 'BE', 86.0), ('Egito', 'EG', 74.0), ('Irã', 'IR', 73.0), ('Nova Zelândia', 'NZ', 66.0)],
            'H': [('Espanha', 'ES', 89.0), ('Cabo Verde', 'CV', 68.0), ('Arábia Saudita', 'SA', 69.0), ('Uruguai', 'UY', 84.0)],
            'I': [('França', 'FR', 93.0), ('Senegal', 'SN', 79.0), ('Iraque', 'IQ', 68.0), ('Noruega', 'NO', 78.0)],
            'J': [('Argentina', 'AR', 94.0), ('Argélia', 'DZ', 75.0), ('Áustria', 'AT', 80.0), ('Jordânia', 'JO', 68.0)],
            'K': [('Portugal', 'PT', 88.0), ('RD Congo', 'CD', 72.0), ('Uzbequistão', 'UZ', 67.0), ('Colômbia', 'CO', 83.0)],
            'L': [('Inglaterra', 'GB-ENG', 90.0), ('Croácia', 'HR', 85.0), ('Gana', 'GH', 72.0), ('Panamá', 'PA', 71.0)],
        }
        
        # Variáveis para simular datas dos jogos
        start_date = timezone.make_aware(datetime(2026, 6, 11, 16, 0))
        match_counter = 0

        for group_name, teams in groups_data.items():
            group = Group.objects.create(name=group_name, tournament=tournament)
            group_teams_objects = []
            
            # 1. Cria os times
            for team_name, code, strength in teams:
                # Regra especial para Inglaterra e Escócia (que não têm código de 2 letras padrão por serem do Reino Unido)
                if code == 'GB-ENG':
                    flag = "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg"
                elif code == 'GB-SCT':
                    flag = "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg"
                elif code != 'TBD':
                    flag = f"https://flagsapi.com/{code}/flat/64.png"
                else:
                    flag = "https://upload.wikimedia.org/wikipedia/commons/b/b0/No_flag.svg"
                
                team_obj = Team.objects.create(
                    name=team_name,
                    group=group,
                    strength=strength,
                    flag_url=flag
                )
                
                # 2. Inicializa a tabela de Classificação (Standing) para cada equipa
                Standing.objects.create(team=team_obj, group=group)
                group_teams_objects.append(team_obj)

            # 3. Gera os 6 confrontos do grupo usando itertools
            matchups = list(itertools.combinations(group_teams_objects, 2))
            
            for team1, team2 in matchups:
                Match.objects.create(
                    team1=team1,
                    team2=team2,
                    group=group,
                    stage=Match.Stage.GROUP,
                    date=start_date + timedelta(days=match_counter % 15) # Espalha os jogos por 15 dias para ter datas diferentes
                )
                match_counter += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Sucesso! 48 equipas, 12 grupos, e {match_counter} jogos gerados perfeitamente."))