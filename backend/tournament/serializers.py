from rest_framework import serializers
from .models import Team, Group, Match

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'strength', 'flag_url']

class GroupSerializer(serializers.ModelSerializer):
    # Isso aqui é a mágica: ele já vai embutir os times dentro de cada grupo no JSON!
    teams = TeamSerializer(many=True, read_only=True) 

    class Meta:
        model = Group
        fields = ['id', 'name', 'teams']

class MatchSerializer(serializers.ModelSerializer):
    # O Pulo do Gato: Embutir os dados completos dos times na partida
    team1 = TeamSerializer(read_only=True)
    team2 = TeamSerializer(read_only=True)

    class Meta:
        model = Match
        # Escolhemos exatamente os campos que o Lance! usa na interface deles
        fields = [
            'id', 'official_id', 'round_number', 'team1', 'team2', 
            'score1', 'score2', 'penalties_score1', 'penalties_score2', 
            'match_date_utc', 'stadium_name', 'stage', 'group', 'played'
        ]