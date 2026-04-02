# AutomatikLabs — Epic Dependency Graph

```mermaid
graph TD
    E01["EPIC-01<br/>Project Scaffolding"]
    E02["EPIC-02<br/>Design System"]
    E03["EPIC-03<br/>Auth & Users"]
    E04["EPIC-04<br/>Database Schema"]
    E05["EPIC-05<br/>Learning Engine"]
    E06["EPIC-06<br/>Comments & Ratings"]
    E07["EPIC-07<br/>Gamification"]
    E08["EPIC-08<br/>Community Feed"]
    E09["EPIC-09<br/>AI Feed"]
    E10["EPIC-10<br/>Marketplace"]
    E11["EPIC-11<br/>Contributor Lessons"]
    E12["EPIC-12<br/>Recommendation"]
    E13["EPIC-13<br/>Newsletter"]
    E14["EPIC-14<br/>Books"]
    E15["EPIC-15<br/>Admin Panel"]
    E16["EPIC-16<br/>AI Responder"]
    E17["EPIC-17<br/>Polish"]

    %% Fase 1 → Fase 2
    E01 --> E02
    E01 --> E04
    E01 --> E03

    %% Fase 2 → Fase 3
    E02 --> E03
    E02 --> E05
    E03 --> E05
    E04 --> E05
    E03 --> E07
    E04 --> E07
    E02 --> E08
    E03 --> E08
    E04 --> E08

    %% Fase 3 → Fase 4
    E04 --> E06
    E05 --> E06
    E04 --> E09
    E08 --> E09
    E03 --> E10
    E04 --> E10
    E07 --> E10
    E05 --> E11
    E07 --> E11
    E04 --> E12
    E05 --> E12
    E02 --> E13
    E03 --> E13
    E02 --> E14
    E04 --> E14

    %% Fase 4 → Fase 5
    E06 --> E16
    E03 --> E15
    E04 --> E15
    E05 --> E15
    E06 --> E15
    E07 --> E15
    E08 --> E15
    E09 --> E15
    E10 --> E15
    E11 --> E15
    E13 --> E15
    E14 --> E15

    %% Fase 5 → Fase 6
    E15 --> E17
    E16 --> E17

    %% Styling
    classDef infra fill:#4a9eff,stroke:#2563eb,color:#fff
    classDef frontend fill:#a78bfa,stroke:#7c3aed,color:#fff
    classDef fullstack fill:#34d399,stroke:#059669,color:#fff
    classDef database fill:#fbbf24,stroke:#d97706,color:#000
    classDef backend fill:#f97316,stroke:#ea580c,color:#fff
    classDef polish fill:#f472b6,stroke:#db2777,color:#fff

    class E01 infra
    class E02 frontend
    class E03 fullstack
    class E04 database
    class E05,E06,E07,E08,E09,E10,E11,E13,E14,E15 fullstack
    class E12,E16 backend
    class E17 polish
```

## Legenda

| Cor | Tipo |
|---|---|
| Azul | Infra |
| Roxo | Frontend |
| Verde | Fullstack |
| Amarelo | Database |
| Laranja | Backend |
| Rosa | Polish |

## Caminho Critico

O caminho critico (longest dependency chain) e:

```
E01 → E04 → E05 → E06 → E16 → E17
E01 → E02 → E03 → E05 → E11 → E15 → E17
```

**Paralelismo maximo:** Fases 3 e 4 permitem ate 7 epics simultaneos com diferentes equipes.
