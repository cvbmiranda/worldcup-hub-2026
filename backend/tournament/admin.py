from django.contrib import admin
from .models import User, Tournament, Group, Team, Match, Standing, Prediction, KnockoutPath

# Registrando as tabelas no painel administrativo
admin.site.register(User)
admin.site.register(Tournament)
admin.site.register(Group)
admin.site.register(Team)
admin.site.register(Match)
admin.site.register(Standing)
admin.site.register(Prediction)
admin.site.register(KnockoutPath)