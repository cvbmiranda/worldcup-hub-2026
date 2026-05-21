from django.core.management.base import BaseCommand
from tournament.models import Match
from tournament.services import calculate_group_positions, update_group_standings
import random
from django.db import transaction

class Command(BaseCommand):
    help = 'Simula resultados aleatórios para todos os jogos da fase de grupos que ainda não foram jogados.'

    def handle(self, *args, **kwargs):
        group_matches = Match.objects.filter(stage=Match.Stage.GROUP, played=False)
        count = 0
        
        with transaction.atomic():
            for match in group_matches:
                match.score1 = random.randint(0, 4)
                match.score2 = random.randint(0, 4)
                match.played = True
                match.save()
                update_group_standings(match.group.id)
                count += 1
            
            calculate_group_positions()

        self.stdout.write(self.style.SUCCESS(f"✅ {count} jogos da fase de grupos simulados com sucesso! Fase de Grupos concluída."))
