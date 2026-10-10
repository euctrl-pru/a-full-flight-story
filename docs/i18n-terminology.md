# i18n terminology and translation rules

Fixed glossary: these terms are rendered the same way everywhere in a locale.

| English | de | fr | it | es | pl |
|---|---|---|---|---|---|
| air navigation service provider | Flugsicherungsorganisation | prestataire de services de navigation aérienne | fornitore di servizi di navigazione aerea | proveedor de servicios de navegación aérea | instytucja zapewniająca służby żeglugi powietrznej |
| air traffic control (ATC) | Flugsicherung / Fluglotsen | contrôle aérien | controllo del traffico aereo | control de tránsito aéreo | kontrola ruchu lotniczego |
| airport slot | Zeitnische (Slot) am Flughafen | créneau aéroportuaire | bande oraria aeroportuale (slot) | franja horaria aeroportuaria (slot) | slot (przydział czasu) na lotnisku |
| take-off slot (CTOT) | Startslot (CTOT) | créneau de décollage (CTOT) | slot di decollo (CTOT) | slot de despegue (CTOT) | slot startowy (CTOT) |
| regulation (ATFM) | ATFM-Regulierung | régulation ATFM | regolazione ATFM | regulación ATFM | regulacja ATFM |
| flight plan | Flugplan | plan de vol | piano di volo | plan de vuelo | plan lotu |
| Network Manager | Netzwerkmanager (Network Manager) | Gestionnaire de réseau (Network Manager) | Network Manager | Gestor de Red (Network Manager) | Menedżer Sieci (Network Manager) |
| reroute | Umleitung | reroutage | reinstradamento | cambio de ruta | zmiana trasy |
| turnaround | Bodenabfertigung (Turnaround) | escale (rotation) | rotazione a terra (turnaround) | escala (turnaround) | obsługa naziemna (turnaround) |
| route charges | Streckengebühren | redevances de route | tariffe di rotta | tasas de ruta | opłaty trasowe |
| strategic / pre-tactical / tactical / post-operations | strategisch / prätaktisch / taktisch / Nachbetrachtung | stratégique / pré-tactique / tactique / post-opérations | strategica / pre-tattica / tattica / post-operazioni | estratégica / pre-táctica / táctica / post-operaciones | strategiczna / przedtaktyczna / taktyczna / po operacjach |
| sources & method | Quellen & Methode | Sources et méthode | Fonti e metodo | Fuentes y método | Źródła i metoda |

## Rules

1. Phase labels (`ph_*_label`) are capitalised as labels. `ph_tactical_label` in German must be exactly "Taktisch" (an e2e test asserts it).
   - de: Strategisch / Prätaktisch / Taktisch / Nachbetrachtung
   - fr: Stratégique / Pré-tactique / Tactique / Post-opérations
   - it: Strategica / Pre-tattica / Tattica / Post-operazioni
   - es: Estratégica / Pre-táctica / Táctica / Post-operaciones
   - pl: Strategiczna / Przedtaktyczna / Taktyczna / Po operacjach
2. Translated chapter kickers must keep their chapter number digits. The "Prologue" and "Zoom out" kickers must contain no digits (the chapter drawer numbers chapters by digits).
3. Keep every `[S…]` / `[D-…]` citation, every `[[TERM]]` / `[[TERM|label]]` term id (translate only the `|label` part), every `[[name:arg]]` token and every `{param}` exactly. Keep `**bold**` and `*em*` markup.
4. Proper names stay: FFS101, Brussels Airport, skeyes, MUAC, ENAV, DSNA, DFS, skyguide, EUROCONTROL. "Network Manager" may be glossed per the table. Keep numbers and units; localise number punctuation inside prose (e.g. "37.034" in German prose).
5. Glossary `gl_*_exp`: use the official local expansion where one exists, else keep English. `gl_*_def`: translate. Glossary acronyms (IFPS, CTOT, ANSP …) stay.
6. Register: natural journalistic prose for an informed general public. No added or removed facts.
7. Source titles and publisher names stay in their original language.
8. `hint_question` is the question "Read this story in <language>?" written in that language.
9. `method_ai_note` is the translation of "This version was translated from the English original with AI assistance."
