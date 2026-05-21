from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError

# =========================
# USER
# =========================
class User(AbstractUser):
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username

# =========================
# TOURNAMENT
# =========================
class Tournament(models.Model):
    name = models.CharField(max_length=100)
    year = models.IntegerField()

    def __str__(self):
        return f"{self.name} {self.year}"

# =========================
# GROUP (A até L)
# =========================
class Group(models.Model):
    name = models.CharField(max_length=2)  # A até L
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="groups")

    def __str__(self):
        return f"Grupo {self.name}"

# =========================
# TEAM
# =========================
class Team(models.Model):
    name = models.CharField(max_length=100)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="teams")
    strength = models.FloatField()  # usado na simulação
    flag_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name

# =========================
# MATCH
# =========================
class Match(models.Model):
    class Stage(models.TextChoices):
        GROUP = "GROUP", "Fase de Grupos"
        ROUND_32 = "ROUND_32", "16-avos de Final"
        ROUND_16 = "ROUND_16", "Oitavas de Final"
        QUARTER = "QUARTER", "Quartas de Final"
        SEMI = "SEMI", "Semifinal"
        FINAL = "FINAL", "Final"

    team1 = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="home_matches", null=True, blank=True)
    team2 = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="away_matches", null=True, blank=True)

    score1 = models.IntegerField(null=True, blank=True)
    score2 = models.IntegerField(null=True, blank=True)

    penalties_score1 = models.IntegerField(null=True, blank=True)
    penalties_score2 = models.IntegerField(null=True, blank=True)

    match_date_utc = models.DateTimeField(null=True, blank=True)
    official_id = models.IntegerField(null=True, blank=True, unique=True)
    round_number = models.IntegerField(null=True, blank=True)
    stadium_name = models.CharField(max_length=200, null=True, blank=True)

    stage = models.CharField(max_length=20, choices=Stage.choices)

    group = models.ForeignKey(Group, null=True, blank=True, on_delete=models.CASCADE)

    played = models.BooleanField(default=False)

    def clean(self):
        if self.team1 and self.team2 and self.team1 == self.team2:
            raise ValidationError("Um time não pode jogar contra ele mesmo.")

    def get_winner(self):
        if not self.played or self.team1 is None or self.team2 is None:
            return None
        if self.score1 is None or self.score2 is None:
            return None

        if self.score1 > self.score2:
            return self.team1
        elif self.score2 > self.score1:
            return self.team2
        else:
            # Empate, resolve nos pênaltis se estiverem definidos
            if self.penalties_score1 is not None and self.penalties_score2 is not None:
                if self.penalties_score1 > self.penalties_score2:
                    return self.team1
                elif self.penalties_score2 > self.penalties_score1:
                    return self.team2
            return None

    def __str__(self):
        t1 = self.team1.name if self.team1 else "TBD"
        t2 = self.team2.name if self.team2 else "TBD"
        return f"{t1} vs {t2} - {self.get_stage_display()}"

# =========================
# KNOCKOUT PATH (chaveamento)
# =========================
class KnockoutPath(models.Model):
    match = models.OneToOneField(Match, on_delete=models.CASCADE, related_name="knockout")
    next_match = models.ForeignKey(
        Match,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="previous_matches"
    )

    def __str__(self):
        return f"Path {self.match}"

# =========================
# STANDING (CLASSIFICAÇÃO POR GRUPO)
# =========================
class Standing(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)

    points = models.IntegerField(default=0)
    goals_for = models.IntegerField(default=0)
    goals_against = models.IntegerField(default=0)
    goal_diff = models.IntegerField(default=0)

    position = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('team', 'group')

    def save(self, *args, **kwargs):
        self.goal_diff = self.goals_for - self.goals_against
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.team} - {self.points} pts"

# =========================
# PREDICTION (bolão)
# =========================
class Prediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="predictions")
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="predictions")

    predicted_score1 = models.IntegerField()
    predicted_score2 = models.IntegerField()

    advancing_team = models.ForeignKey(Team, on_delete=models.CASCADE, null=True, blank=True, related_name="predicted_advancements")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'match')

    def __str__(self):
        return f"{self.user} - {self.match}"

# =========================
# SCORE (ranking geral)
# =========================
class Score(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user} - {self.points} pts"

# =========================
# SCORE HISTORY (evolução)
# =========================
class ScoreHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="score_history")
    points = models.IntegerField()
    round = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.points} pts ({self.round})"