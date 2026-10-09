# How a flight becomes a flight in Europe: research fact base

**Hero flight:** Brussels (EBBR/BRU) to Rome Fiumicino (LIRF/FCO), an A320neo-class jet on a summer day in IATA season S26.
**Plot twist:** an en-route ATFM regulation on the day gives the flight a CTOT (slot), and the Network Manager then offers a reroute.
**Audience:** informed general public. **Compiled:** 2026-10-09.

**Conventions**
- Every fact is cited inline as `[Sn]`. The full source list is in the **Sources** table at the end. Primary sources (EUROCONTROL, EU law, ANSPs, airports, IATA) are used wherever possible.
- `[unverified]` means I could not confirm the claim against a source. Treat it as plausible but check it before publishing.
- `[illustrative]` marks invented or simplified story details, such as callsigns, waypoints, sector names and exact clock times. They show how the process works and are not records of a real flight.
- Times are in UTC unless stated otherwise. In summer, Brussels and Rome are UTC+2.

---

## 0. The hero flight at a glance

| Item | Value | Notes |
|---|---|---|
| Great-circle distance EBBR to LIRF | ≈1,172 km / 633 NM | Computed from aerodrome coordinates; a third-party route site gives 633 NM / 1,173 km [S50] |
| Scheduled block time | ≈2 h 00 to 2 h 05 | Travel-booking listings for BRU to FCO [S51] `[unverified, secondary]` |
| Typical aircraft | Airbus A320 family | The A320neo has an MTOW of **79.00 t** and seats 150–180 in two classes (max 194) [S35] |
| Great-circle ground track | Belgium (Ardennes), Luxembourg, Lorraine/Alsace (France), northern Switzerland, Ticino, then Milan, Tuscany and Rome | Computed track. The real filed route depends on RAD restrictions, free-route airspace, winds and charges [S17][S18] |
| Departure airport | Brussels Airport: 24.4 M passengers and 198,370 movements in 2025 | [S40] |
| Arrival airport | Rome Fiumicino: the 9th-busiest European airport (884 average daily arrivals and departures in 2025); passed 50 M passengers for the first time in 2025 | [S1][S41] |
| Story callsign | Use a fictional one, e.g. `HRO123` | `[illustrative]` This avoids implying a real airline's actual operations |

**Suggested cast of ATC units along the great-circle track** (one plausible sequence; the actual route varies) `[illustrative]`:
Brussels TWR (skeyes) → Brussels APP/ACC (skeyes, below FL245) → **MUAC** (EUROCONTROL, FL245–FL660 over Benelux and NW Germany) → **Reims ACC** (DSNA, France) → **Zurich or Geneva ACC** (skyguide) → **Milano ACC** (ENAV) → **Roma ACC** (ENAV) → Roma APP → Fiumicino TWR.
A reroute plot twist could swap Reims for **Karlsruhe UAC/Langen** (DFS, Germany).

---

## 1. Strategic phase: from about 18 months down to about a week before the flight

### 1a. Airport slots (airline ↔ slot coordinator)
- **Brussels Airport has been a coordinated airport since 23 June 2003.** Airlines must hold a slot from the coordinator before they can land or take off there. The coordinator is **Belgium Slot Coordination (BSC)**, appointed by the federal Minister of Mobility [S26]. The acronym "BSCA" in the brief is wrong: BSCA is Brussels South Charleroi Airport.
- **Italy:** **Assoclearance** was set up in 1997 to coordinate slots at Italian coordinated airports. Roma Fiumicino is one of them [S27].
- The rules come from **EU Regulation (EEC) 95/93**. Under its **"80/20" use-it-or-lose-it rule** (Art. 10(2)), a carrier keeps its historic precedence for a series of slots only if it operated them at least 80% of the time in the season [S21].
- The global framework is the **Worldwide Airport Slot Guidelines (WASG)**, now in **Edition 4**. IATA, ACI and the Worldwide Airport Coordinators Group (WWACG) publish it jointly [S22][S23].
- **Scale:** in 2026, **395 airports** are subject to coordination, **216 of them fully slot-coordinated (Level 3)**. About **43% of passengers worldwide** depart from a slot-coordinated airport [S23].
- **Seasons:** the IATA Northern Summer season runs from the last Sunday of March to the last Saturday of October. For example, S25 ran 30 March to 25 October 2025, which is 30 weeks [S25]. By the same rule S26 runs 29 March to 24 October 2026 (derived).
- **A typical coordination calendar**, using the Dutch coordinator's S25 dates as the example [S25]:
  - historic slot list (SHL) issued about mid-September;
  - Agreed Historics Deadline 3 October 2024;
  - **Initial Submission Deadline 10 October 2024**;
  - Initial Slot Allocation (SAL) issued after that;
  - IATA **Slot Conference** in November.
- IATA holds two Slot Conferences a year. SC158 was in Bangkok on 9–11 June 2026 (for the winter season) and SC159 is in Budapest on 17–19 November 2026 (for Summer 2027) [S24].
- **Story beat:** the hero flight's 07:00 departure from BRU and its late-morning arrival at FCO exist first as **two airport slots** (a departure slot at BRU and an arrival slot at FCO). They are agreed about 5 to 6 months before the season starts. *Airport slots are not the same as ATFM slots (CTOTs).* This distinction is a key teaching point.

### 1b. Airline network, schedule, fleet and crew (airline)
- The airline builds its schedule around slot availability, fleet rotations and crew rules. It then publishes the schedule and puts it on sale. This step is generic airline practice and no specific source was gathered for it `[unverified: no specific source]`.
- Market context: in 2025 **low-cost carriers (35.4% of flights) flew more flights than mainline carriers (34.7%) for the first time** in the NM area. Ryanair Group averaged 3,184 daily flights [S1].

### 1c. Airspace and route network design (Network Manager + States/ANSPs)
- **EU Implementing Regulation 2019/123** sets the **network functions** that the **Network Manager (NM)** performs, including **European Route Network Design (ERND)** and **Air Traffic Flow Management (ATFM)**. It also requires a Network Strategy Plan [S20].
- **Network Manager = EUROCONTROL.** EUROCONTROL has **42 Member States**, **2 Comprehensive Agreement States** (Israel and Morocco), **2,000+ staff**, a budget of more than **€1 billion**, and 4 sites in Belgium, France, Luxembourg and the Netherlands [S2]. NM's operations centre is the **NMOC** in Brussels (Haren). How many staff NM itself has `[unverified]`.
- **Route Availability Document (RAD):** the common reference that holds route restrictions, both structural and ATFCM-driven (level caps, routing restrictions, equipment requirements). It is updated every **AIRAC cycle (28 days)**. National RAD coordinators maintain it and it is published 28 days before each cycle starts [S17].
- **Free Route Airspace (FRA):** airlines plan user-preferred segments between published entry and exit points instead of fixed airways. About **76 ACCs** had full or partial FRA by the end of 2025, and Europe-wide full implementation is projected for **2029** [S18]. NM also runs **airspace improvement packages**: more than 100 were implemented in 2025 [S3].
- **Network Operations Plan (NOP):** the output of the strategic ATFCM phase. NM coordinates strategic measures for big events (axis management, air shows, sports events, military exercises) together with the FMPs and ANSPs [S8].

### 1d. Capacity planning (ANSPs + NM)
- The ANSPs commit to sector capacity in the NOP. In 2025 "the vast majority of ANSPs fulfilled the commitments made in the NOP" [S3].
- **Scale of the system:**
  - **37 en-route ANSPs** cover **11.5 million km²** of continental European airspace [S49]. The ACE benchmarking report covers **38 ANSPs** [S48].
  - Number of **ACCs**: about 60–70; number of **en-route sectors**: about 700 or more at full configuration `[unverified: sources disagree; secondary/ICAO presentations]`.

---

## 2. Pre-tactical phase (D-6 to D-1)

- **The pre-tactical phase covers the six days before the day of operations.** NM compares forecast demand with the capacity predicted for that day, then refines the strategic plan. Tools include sector configurations, scenarios and ATFCM measures. Decisions are taken through collaborative decision-making (CDM) among NM, the Flow Management Positions (FMPs) and airlines [S8].
- **Output: the ATFCM Daily Plan (ADP).** It is published as **ATFCM Notification Messages (ANM)**, as the **Initial Network Plan (INP)**, and on the **NOP portal** [S8].
- The **INP** is produced on **D-1** by NM's pre-tactical team. It sets out the next day's network plan and flags significant events [S8].
- **On D-1 at about 17:00 UTC in winter (16:00 UTC in summer), the ADP is transferred from PREDICT, the pre-tactical system, into ETFMS, the tactical system** [S8]. **Story beat:** at about 18:00 Brussels time the evening before, "tomorrow" becomes "today" inside NM's computers.
- **Airspace Use Plan (AUP/UUP) and Flexible Use of Airspace (FUA):**
  - Military areas (TRAs, TSAs, danger areas) are booked day by day.
  - Each national **Airspace Management Cell (AMC)** publishes an **AUP** for the next day (00:00 to 24:00 UTC).
  - **Updated AUPs (UUPs)** change allocations on the day itself.
  - NM's **CADF** consolidates them into the **European AUP (EAUP)** and **EUUPs** [S19].
- Military training zones take up "about 50% of the total airspace" in Belgium [S28]. This is a strong visual for why FUA matters.
- The exact AUP and EAUP publication cut-off times `[unverified]`.

---

## 3. Filing the flight plan (airline OCC/dispatcher → IFPS)

### 3a. Who and how
- The airline's **Operations Control Centre (OCC)** and its flight dispatchers use flight-planning software. Common commercial examples are Lufthansa Systems **Lido/Flight** and Boeing/**Jeppesen** tools `[unverified: product names are common knowledge, not sourced]`. The software optimises the route and level for wind, weight, RAD constraints and route charges.
- All IFR GAT flights in the **IFPS Zone (IFPZ)** must file with the **Integrated Initial Flight Plan Processing System (IFPS)** run by NM [S9].
- **The IFPS is now in one place, Brussels (Haren).** The second unit, IFPU2 at Brétigny-sur-Orge (France), closed on **29 November 2020**. The brief's "Haren/Brétigny" description is therefore out of date.
  - IFPS handles **up to 100,000 flight-plan messages a day**.
  - **More than 99% are processed automatically**, and about 1,000 a day (about 1%) need a human [S10].

### 3b. When
- A flight plan can be filed **up to 120 hours (5 days) before EOBT**. If it is filed more than 24 hours ahead it must include the date of flight (DOF/) [S9].
- It should be filed **at least 3 hours before EOBT** "where possible". IFPS still accepts later filings sent for operational reasons [S9].
- The Irish AIP gives the national wording. Flights that may be subject to ATFM must file at least 3 h before EOBT. Other flights must file at least 30 min before EOBT [S12].
- **A delay of more than 15 minutes to the EOBT** of an IFR flight requires a **DLA** (or CHG) message, unless the flight already has a slot [S12].

### 3c. What is in the message (ICAO FPL 2012 format)
The main items are listed below. The field list follows ICAO Doc 4444 conventions as applied in the IFPS Users Manual [S9]. The hero values are `[illustrative]`.

| Item | Content | Hero example |
|---|---|---|
| 7 | Aircraft identification | `HRO123` |
| 8 | Flight rules / type | `IS` (IFR, scheduled) |
| 9 | Number/type/wake turbulence category | `A20N/M` |
| 10 | Equipment / surveillance | e.g. `SDE1E2FGHIJ1RWY/LB1` |
| 13 | Departure aerodrome + EOBT | `EBBR0500` (05:00 UTC = 07:00 local) |
| 15 | Cruise speed, level, route | `N0450F350 <SID exit> … DCT … <STAR entry>` |
| 16 | Destination, total EET, alternates | `LIRF0150 LIRN` |
| 18 | Other info (PBN/, DOF/, REG/, RMK/, etc.) | `PBN/A1B1C1D1O1S2 DOF/260710 REG/OOSNx` |
| 19 | Supplementary info (endurance, persons on board, etc.) | Kept by the operator; not sent in the FPL |

### 3d. Validation and replies
- IFPS checks syntax, route and airspace availability (including RAD) and the flight profile, then answers with an **Operational Reply Message (ORM)** [S9]:
  - **ACK**: accepted automatically;
  - **MAN**: sent to manual processing by an IFPS operator;
  - **REJ**: rejected; the airline must correct and refile.
- Accepted plans are **distributed to every ATC unit along the route** inside the IFPZ and to ETFMS. ETFMS is the flow management system that builds the flight's 4D profile [S7][S9].
- Later updates use **CHG** (change), **DLA** (delay) and **CNL** (cancel) [S9][S12].
- **FF-ICE (Flight and Flow Information for a Collaborative Environment), Release 1:** EU requirements apply **from 31 December 2025**. NM offers an FF-ICE **Filing Service** (eFPL with 4D trajectory, performance data and a Global Unique Flight Identifier, GUFI) and a **Trial Service** for "what-if" checks [S44]. NM reports that some airspace users and ANSPs were late implementing FF-ICE R1 [S3].

---

## 4. Tactical ATFCM on the day: the plot twist

### 4a. Why regulations happen
- NM and the local **FMP** watch **demand against capacity** for each traffic volume or sector. When demand exceeds capacity, NM activates an **ATFM regulation** with a location, start and end times and an entry rate [S7].
- **Worked example from the manual:** a 4-hour regulation at **28 flights/hour** creates **112 slots, about 2 minutes apart** [S7]. This is a ready-made visual: a conveyor belt of 112 slots.

### 4b. How a flight gets its slot (CASA)
- **"The act of filing a flight plan effectively constitutes a request for a slot."** The Computer Assisted Slot Allocation (**CASA**) system is centralised and largely automatic [S7].
- **Pre-allocation:** flights are placed in a Slot Allocation List in order of their estimated time over the restricted location, in line with first-planned, first-served. A higher-priority flight can push others down the list, which can cause a **chain reaction** [S7].
- **At EOBT minus 2 hours** (Slot Issue Time), CASA freezes the slot and sends a **Slot Allocation Message (SAM)** with the **CTOT** to the airline and to the departure tower [S7].
- **The slot tolerance window is -5 to +10 minutes around the CTOT.** "A slot tolerance (-5' to +10') is available to ATC for which the aircraft must not depart outside" [S7][S11].
- **Airlines and ATC share responsibility** for slot adherence. **The CTOT is part of the ATC clearance.** ATC may refuse start-up to a flight that cannot meet its CTOT [S7].

### 4c. The message family (who sends what)
| Message | Direction | Purpose |
|---|---|---|
| **SAM** (Slot Allocation Message) | NM → AO + ATC | Issues the CTOT (at the earliest EOBT-2h) [S7] |
| **SRM** (Slot Revision Message) | NM → AO + ATC | Moves an issued CTOT later or earlier [S7][S11] |
| **SLC** (Slot Cancellation / slot requirement cancelled) | NM → AO + ATC | The flight is no longer regulated. If it arrives after EOBT+15 min, the AO must send a DLA/CHG [S7] |
| **SIP / SPA / SRJ** | NM → AO; AO → NM | Slot Improvement Proposal; the AO accepts (SPA) or rejects (SRJ) [S7] |
| **SWM** (SIP Wanted Message) | AO → NM | Asks to receive improvement proposals [S7] |
| **REA** (Ready) | ATC (at the AO's request) → NM | "We can go now": NM tries to improve the CTOT. Can be sent from EOBT-15 min [S7][S11] |
| **RRP / RJT** | NM → AO; AO → NM | Rerouting Proposal with a new route (and possibly a new CTOT), and its rejection [S7] |
| **FLS / DES** | NM → AO + ATC | Flight suspension / de-suspension, e.g. after FAM [S7] |
| **DPI** (E-, T-t, T-s, A-, C-DPI) | A-CDM airport → NM | Departure Planning Information (see section 5) [S7] |

- **Slot extension:** if the flight is about to miss its CTOT, the airline can ask the NM helpdesk once for an extension of up to 10 minutes, in the 20 minutes before the calculated off-block time. **This is not available on request at A-CDM airports such as Brussels.** There the pilot asks the tower over the radio after start-up approval, or else the airline updates the TOBT [S7].
- **Flight Activation Monitoring (FAM):** if a flight is not reported airborne, ETFMS shifts its departure time three times by 5 minutes and **suspends it after 17 minutes** with an FLS "NOT REPORTED AS AIRBORNE". This frees up the slot [S7].

### 4d. Reroutes and STAM
- An **RRP** comes in one of two kinds:
  - **"PURPOSE IS ATFCM"**: the aim is to avoid delay;
  - **"PURPOSE IS FLIGHT EFFICIENCY"**: the aim is a shorter or cheaper route.
- RRPs are also issued with "PURPOSE IS STAM" (Short-Term ATFCM Measures).
- The airline accepts by refiling (CHG, or CNL plus new FPL) before the **RESPBY** time, or declines with **RJT** [S7].
- **STAM** are targeted measures such as minor reroutes, level caps or small ground delays applied to a few flights instead of a full regulation. FMPs list them among their tools [S8]. A detailed definition is in the ATFCM Operations Manual `[definition paraphrased]`.
- **2025 results:**
  - NMOC's direct actions saved **2.2 million minutes** of en-route ATFM delay;
  - RRPs saved another **277,000 minutes**;
  - together that is **10.6% of total en-route delay**, against a 10% target [S3].
  - More than **3,000 hand-picked rerouting proposals** went to 260 operators, saving on average **90 NM, 450 kg of fuel and €112 in route charges per flight** [S3].

### 4e. Hero storyline (suggested) `[illustrative]`
1. **D-1, 16:00 UTC:** the INP warns of reduced capacity in a Reims ACC sector group because of staffing. France caused **36%** of all en-route ATFM delay in 2025, with Reims among the main contributors [S1].
2. **03:00 UTC (EOBT-2h):** a SAM arrives: **CTOT 05:42** instead of a planned take-off of about 05:15. That is 27 minutes of ATFM delay.
3. **03:20 UTC:** an RRP proposes routing east via Karlsruhe UAC and Zurich. The new route is about 15 NM longer but has CTOT 05:22. The dispatcher compares extra fuel and charges against the delay and accepts by CHG before RESPBY.
4. **Take-off at 05:24:** inside the -5/+10 window.

### 4f. How much delay, and why (Europe-wide, 2025)
- **ATFM delay averaged 2.4 min per flight**, 17% less than 2024: **1.7 min en-route** and **0.7 min at airports**. The EU-wide target for 2025 was **0.9 min/flight** en-route [S1].
- **En-route ATFM delay by cause, 2025:**
  - **ATC capacity & staffing: 58%**;
  - **weather: 28%**;
  - the rest is ATC disruptions (strikes), equipment and other causes (≈14%, derived) [S1].
- By country: **France 36%**, Germany 14%, Spain 13%. **Marseille ACC** had the highest delay at 2.6 min/flight, Reims 1.3, Karlsruhe 0.8 [S1].
- Flights delayed more than 15 minutes by ATFM: **5.3%** in 2025, down from 6.4% in 2024 [S3].
- **All-causes departure delay was 14.6 min/flight** in 2025, down 16% from 2024. **Reactionary (knock-on) delay** is the biggest cause: in 2024 it was 46% of delay minutes (8.0 min/flight), followed by airline causes at 4.3 min/flight [S1][S36].
- **Punctuality in 2025:** arrivals **76.1%** and departures **70.1%** within 15 min of schedule [S1]. NM's own report gives 75.4% arrival punctuality, using a different flight scope [S3].

---

## 5. Airport operations and A-CDM at Brussels (airport, airline, handler, skeyes)

- **Airport Collaborative Decision Making (A-CDM)** shares one set of milestones among the airport operator, airlines and handlers, ATC and NM. **About 34 European airports have full A-CDM**, Rome Fiumicino among them [S14]. Brussels was reported as fully implemented on **29 June 2010** [S15] `[date from EUROCONTROL Airport Corner listing via search snippet]`. ENAV and ADR integrated A-CDM at Fiumicino after a year of trials [S16].
- **The 16 A-CDM milestones** (Airport CDM Implementation Manual v5.0, table of milestones, verified) [S13]: 1 ATC flight plan activated (≈EOBT-3h, triggers E-DPI) · 2 EOBT-2h · 3 Take-off from outstation (ATOT) · 4 Local radar update · 5 Final approach · 6 Landing (ALDT) · 7 In-block (AIBT) · 8 Ground handling starts (ACGT) · 9 TOBT update prior to TSAT · 10 TSAT issue · 11 Boarding starts · 12 Aircraft ready (ARDT) · 13 Start-up request (ASRT) · 14 Start-up approved (ASAT) · 15 Off-block (AOBT) · 16 Take-off (ATOT).
- **Key times:**
  - **EOBT**: Estimated Off-Block Time, from the flight plan.
  - **TOBT**: Target Off-Block Time. The airline or handler commits to when the aircraft will be ready.
  - **TSAT**: Target Start-up Approval Time. ATC builds the pre-departure sequence and takes the CTOT into account.
  - **TTOT**: Target Take-Off Time.
  - **ASAT / AOBT / ATOT**: the actual start-up approval, off-block and take-off times [S7][S13].
- **DPI messages** connect the airport to the network [S7]:
  - **E-DPI** from **EOBT-3h**: checks the flight plan against the airport slot (SOBT);
  - **T-DPI-t** from **EOBT-2h**: based on the TOBT;
  - **T-DPI-s** from **TOBT-40 min**: based on the TSAT, so ATC's sequence;
  - **A-DPI** at off-block;
  - **C-DPI** if the turnaround is interrupted.
  - At an A-CDM airport a T-DPI-s can work like a REA message (ready to improve) [S7].
- **Turnaround:** the inbound aircraft lands, goes on blocks, then is deboarded, cleaned, catered, refuelled and boarded, with baggage handled throughout. Handlers and the airline update the TOBT. De-icing only matters in winter. For an A320 the minimum turnaround is about 35–45 min `[unverified]`.
- **ATC clearance:** the CTOT is included in the clearance [S7]. Whether Brussels uses **DCL** (datalink departure clearance) `[unverified]`.
- **Runways at Brussels:** three runways (07L/25R, 07R/25L, 01/19). They are chosen through a government **Preferential Runway System**, which depends on time of day and day of week, plus wind limits [S45].
- **skeyes** is the Belgian ANSP. It controls Brussels and the regional airports and **manages Belgian airspace up to about 7,500 m (FL245)**. Its main site is in Steenokkerzeel. Civil and military controllers have shared an ops room since December 2019 [S28].
- **Network effect:** in 2025, departure punctuality at Brussels was "just slightly below 2024", while Fiumicino improved by **+10 percentage points**, one of the biggest gains in Europe [S1].

---

## 6. Departure and climb (skeyes → MUAC)

- **SID:** Brussels has published SIDs named after their end points, e.g. LNO, SPI, SOPOK, ROUSY, PITES, CIV [S46]. Which SID a south-east departure to Italy would use depends on the runway and the RAD `[unverified for the specific SID]`.
- **Handover to the upper airspace:** skeyes hands the climbing flight to **MUAC above FL245** [S28].
  - MUAC is run by EUROCONTROL for **Belgium, Germany, Luxembourg and the Netherlands**. It covers the **Brussels UIR, Amsterdam FIR and Hannover UIR from FL245 to FL660** [S5].
  - Over Luxembourg and south-east Belgium, MUAC's own internal split between sector layers is at **FL355** (since 27 February 2020) [S29].
- **MUAC in 2025** [S5][S6]:
  - **1,829,242 flights**, about 4,826 a day on average;
  - **record day 5,831 flights on 4 July 2025**;
  - **320 ATCOs in operations**;
  - **over 16% of all European flights** used its airspace.
- **CPDLC (datalink) now carries about 60% of clearances at MUAC, about 14,000 a day** [S5]. The EU datalink rule (Reg. 29/2009) requires CPDLC for IFR GAT flights above **FL285** in the defined airspace. For operators it has applied since **5 February 2020** [S42].
- **Emissions by flight phase:** **climb is 27%** of gate-to-gate CO₂, cruise 62% and descent 8% [S1].

---

## 7. En route: crossing four countries

- **Likely ACC sequence** on the great-circle line `[illustrative]`: MUAC → **Reims ACC** (DSNA) → **Zurich ACC** (skyguide, Wangen near Dübendorf) or **Geneva ACC** → **Milano ACC** (ENAV) → **Roma ACC** (ENAV). With a reroute via Germany, Karlsruhe UAC (DFS) would come before Zurich.
  - **skyguide** runs two centres, Zurich/Wangen and Geneva. Geneva also handles the airspace over the French Alps and part of the Italian border airspace [S31] `[secondary source]`.
  - **ENAV** runs **four ACCs: Rome, Milan, Padua and Brindisi**, and towers at **45 airports** [S30]. Padova ACC covers north-east Italy and is unlikely to be on this route `[unverified]`.
- **Handovers between centres** are coordinated system-to-system with **OLDI**, EUROCONTROL's On-Line Data Interchange. For example, the **ACT** message replaces the old spoken estimate [S43].
- **Free route:** most of the en-route part can be flown as FRA "DCT" segments where FRA exists [S18].
- **Traffic scale along the corridor** (average daily flights in 2025, including overflights) [S1]:
  - France 9,854;
  - Italy 6,295 (+17% vs 2019);
  - Belgium/Luxembourg 3,478;
  - Switzerland 3,287.
- **Typical cruise:** FL340–FL380 at about Mach 0.78 `[unverified: typical A320 values]`. Airborne time is about 1 h 45, within a block time of about 2 h [S51] `[unverified]`.

### 7a. Route charges 2026 (EUROCONTROL CRCO)

**Who:** EUROCONTROL's **Central Route Charges Office (CRCO)** calculates, bills and collects en-route charges for the Contracting States of the Multilateral Agreement relating to Route Charges, including Belgium, Luxembourg, Germany, France, Switzerland and Italy [S32]. **2025 total: €11.8 billion billed**, €1.8 bn more than 2024 [S1].

**Formula** [S32][S33]:
- Charge per zone **rᵢ = tᵢ × Nᵢ**, where tᵢ is the zone's unit rate and Nᵢ its service units.
- **Nᵢ = dᵢ × p**.
- **Distance factor dᵢ** = great-circle km flown in the zone ÷ 100. It is measured from the departure aerodrome or zone entry point to the destination aerodrome or zone exit point, along the **actual route flown as recorded by NM**.
- **The distance is reduced by 20 km for each take-off from and each landing in the zone** (Implementing Regulation (EU) 2019/317, Annex) [S33].
- **Weight factor p = √(MTOW in tonnes ÷ 50)**, rounded to 2 decimals, using the highest certificated MTOW [S32][S33].
  - **A320neo: MTOW 79.00 t** [S35], so **p = √(79/50) = √1.58 = 1.26**.
- The unit rate is the charge for a 50-tonne aircraft flying a distance factor of 1.00 (100 km) [S33].

**Unit rates for October 2026 flights**, global unit rate in EUR [S34]. The rates are recalculated monthly for non-euro zones. Belgium-Luxembourg, France, Germany and Italy apply from 1 January 2026 and are unchanged in the August and October 2026 tables.

| Charging zone | Global unit rate (EUR) | Note |
|---|---|---|
| Belgium-Luxembourg | **116.65** | National rate 116.55 + administrative 0.10 |
| France | **79.58** | |
| Germany | **97.89** | |
| Switzerland | **167.12** | CHF zone; Oct 2026 FX 1 EUR = 0.942732 CHF (it was 170.28 in Aug 2026) |
| Italy | **73.71** | |

**Illustrative hero calculation** `[illustrative: real billing uses the NM-recorded route; the zone split here is approximated from the great-circle track]`:

| Zone | ≈ km in zone | − 20 km | dᵢ | × p (1.26) × rate | ≈ € |
|---|---|---|---|---|---|
| BE-LU | 192 | −20 (take-off) | 1.72 | × 1.26 × 116.65 | ~253 |
| FR | 248 | – | 2.48 | × 1.26 × 79.58 | ~248 |
| CH | 206 | – | 2.06 | × 1.26 × 167.12 | ~434 |
| IT | 526 | −20 (landing) | 5.06 | × 1.26 × 73.71 | ~470 |
| **Total** | | | | | **≈ €1,400** |

**Visual hook:** Switzerland is about **18% of the distance but about 31% of the bill**. Rerouting via Germany or France changes the bill, and this is one reason airlines sometimes choose longer routes. The 2025 overview says the Netherlands lost overflights partly because of unit-rate increases [S1]. Terminal (approach) charges at EBBR and LIRF are separate and not included here.

---

## 8. Descent and arrival at Fiumicino (ENAV, ADR)

- **Top of descent** is about 150–200 km before Rome `[unverified: rule of thumb]`. Descent is about 8% of gate-to-gate CO₂ [S1].
- **STAR / Roma APP:** ENAV's Roma ACC and Roma approach sequence arrivals. Arrival management (AMAN) sets landing order and times. Whether Fiumicino has an extended AMAN reaching into adjacent centres `[unverified]`.
- **Runways at Fiumicino** [S47] `[secondary source]`: 16L/34R and 16R/34L (about 4 km apart) and 07/25. Runway 25 is used mainly for departures. Most arrivals use 16L/34R.
- **Landing, taxi-in, on-blocks:** **ALDT** (landing) and **AIBT** (in-block) close the flight's operational record. AIBT also opens the next turnaround's A-CDM milestones [S13].
- **Fiumicino in context:** 884 average daily arrivals and departures in 2025 (9th in Europe, +4% vs 2019) [S1]; more than 51 M passengers in 2025 [S41].

---

## 9. Post-operations: the flight becomes data

- **Post-ops analysis** is the last ATFCM phase. It compares the plan with what happened (ATFM delay, use of scenarios, route extension) against performance targets and feeds lessons back into the next strategic cycle [S8].
- **Route charges:** CRCO bills the airline monthly using the **route actually flown as recorded by NM** [S32][S33]. The interest rate on late payment is 13.79% p.a. (2025) [S32].
- **Delay attribution:** ATFM delay is attributed to the regulation and its cause code (C capacity, S staffing, W weather, etc.). All-causes delay is collected through **CODA** (Central Office for Delay Analysis) [S36]. MUAC lists its own cause codes: C, R, S, T, M, P (ATC capacity, routeing, staffing, equipment, airspace management, special event) [S5].
- **Performance review:**
  - The **Performance Review Commission (PRC)**, set up in 1998, gives independent advice on European ATM performance, supported by the **Performance Review Unit (PRU)** [S37].
  - Data is published on the **Aviation Intelligence Portal (ansperformance.eu)** [S38].
- **Public data:**
  - The **EUROCONTROL Data app** shows traffic, ATFM delay and punctuality for the network, States, airlines, airports and ANSPs. It is refreshed daily with the previous day's data, and also shows monthly CO₂ and en-route charge data [S39].
  - The **Daily Traffic Variation dashboard** is on the same portal [S38].
- **Emissions:** gate-to-gate CO₂ in the NM area in **2025 was 216 Mt (+5%)**. CO₂ per unit of weight improved by 2% over 2022–2025 [S1]. Hero estimate: about 2.3–2.8 t of fuel, or about 7–9 t of CO₂ (at 3.16 kg CO₂ per kg fuel) `[unverified estimate]`.

---

## 10. European-scale numbers (for the "zoom out" moments)

| Fact | Value | Source |
|---|---|---|
| Flights in NM area, 2025 | **11.1 million** (+4% vs 2024; back to 2019 level) | [S1] |
| Average per day, 2025 | **>30,000**; summer (May–Aug) 35,122/day | [S3][S4] |
| Network record day | **37,034 flights on 18 July 2025** | [S1][S3] |
| Busiest week, Saturday, Sunday (summer 2025) | 35,756 average/day; 33,987; 35,009 | `[unverified: from a search snippet, source page not opened]` |
| EUROCONTROL Member States | **42** (+2 Comprehensive Agreement States) | [S2] |
| EUROCONTROL staff | **2,000+** | [S2] |
| En-route ANSPs | **37** (ACE report covers 38) | [S49][S48] |
| Continental airspace | **11.5 million km²** | [S49] |
| ACCs / sectors | about 60–70 ACCs; about 700+ sectors | `[unverified]` |
| FRA-enabled ACCs | ~76 by end-2025 | [S18] |
| Flight-plan messages | up to **100,000/day**, >99% automatic | [S10] |
| MUAC | 1.83 M flights in 2025; record 5,831 in one day; >16% of European flights | [S5][S6] |
| En-route charges billed | **€11.8 bn** (2025) | [S1] |
| CO₂ (gate-to-gate) | **216 Mt** (2025) | [S1] |
| Slot-coordinated airports worldwide | 216 Level 3 (395 coordinated in total), 2026 | [S23] |
| A-CDM airports (full) | 34 | [S14] |

---

## 11. Stakeholder glossary

- **Passengers:** buy the ticket and feel the delay. 76.1% of arrivals were on time in 2025 [S1].
- **Airline / Aircraft Operator (AO) and its OCC:** plans the schedule, requests airport slots, files and updates the flight plan, responds to SAM/SIP/RRP, sets the TOBT, and pays route charges [S7][S9].
- **Flight dispatcher:** the OCC role that builds the operational flight plan and files the ATC flight plan (ICAO FPL) `[role description generic]`.
- **Pilots (flight crew):** take the briefing (route, NOTAMs, weather, CTOT), request start-up and clearance, and can ask the tower for a slot extension at A-CDM airports [S7].
- **Slot coordinator** (BSC for Brussels, Assoclearance for Italy): independent body that allocates airport slots under EU 95/93 and the WASG [S21][S26][S27].
- **Network Manager (EUROCONTROL) / NMOC:** designs the route network, plans and manages ATFCM, issues slots, and runs IFPS [S7][S20].
- **IFPS:** NM's flight plan processing and distribution system, now based in Brussels [S9][S10].
- **ANSPs:** skeyes (Belgium), MUAC (EUROCONTROL, upper Benelux/NW Germany), DSNA (France), DFS (Germany), skyguide (Switzerland), ENAV (Italy). They provide ATC [S5][S28][S30].
- **FMP (Flow Management Position):** the ANSP's flow unit that works with NM on capacity and regulations [S7][S8].
- **Airport operator:** Brussels Airport Company and Aeroporti di Roma. They run the infrastructure and the A-CDM platform [S13][S16].
- **Ground handler:** turnaround services (ramp, fuel, catering, boarding). Updates the TOBT [S13].
- **Military / AMC:** book reserved airspace through AUP/UUP under FUA [S19][S28].
- **Met services:** provide forecasts and warnings. Weather caused 28% of en-route ATFM delay in 2025 [S1].
- **CRCO:** EUROCONTROL's route charges billing office [S32].
- **PRC/PRU:** independent performance review [S37].

## 12. Acronym glossary

| Acronym | Meaning |
|---|---|
| A-CDM | Airport Collaborative Decision Making |
| ACC / UAC | Area Control Centre / Upper Area Control Centre |
| ACK / MAN / REJ | IFPS Operational Reply Messages: acknowledged / manual / rejected |
| ADP / INP | ATFCM Daily Plan / Initial Network Plan |
| AIBT / AOBT / ALDT / ATOT | Actual In-Block / Off-Block / Landing / Take-Off Time |
| AIRAC | Aeronautical Information Regulation And Control (28-day cycle) |
| AMAN | Arrival Manager |
| AMC | Airspace Management Cell |
| ANM | ATFCM Notification Message |
| ANSP | Air Navigation Service Provider |
| AO / AOC / OCC | Aircraft Operator / Air Operator Certificate / Operations Control Centre |
| ASAT | Actual Start-up Approval Time |
| ATFM / ATFCM | Air Traffic Flow (and Capacity) Management |
| AUP / UUP / EAUP | (Updated / European) Airspace Use Plan |
| CASA | Computer Assisted Slot Allocation |
| CHG / DLA / CNL | Change / Delay / Cancel flight-plan messages |
| CODA | Central Office for Delay Analysis |
| CPDLC / DCL | Controller–Pilot Data Link Communications / Departure Clearance (datalink) |
| CRCO | Central Route Charges Office |
| CTOT | Calculated Take-Off Time (the ATFM slot) |
| DOF | Date of flight (Item 18) |
| DPI | Departure Planning Information (E-, T-t, T-s, A-, C-) |
| EOBT | Estimated Off-Block Time |
| ERND | European Route Network Design |
| ETFMS | Enhanced Tactical Flow Management System |
| FAM / FLS / DES | Flight Activation Monitoring / Flight Suspension / De-suspension |
| FF-ICE / eFPL / GUFI | Flight & Flow Information for a Collaborative Environment / extended flight plan / Globally Unique Flight Identifier |
| FMP | Flow Management Position |
| FRA | Free Route Airspace |
| FUA | Flexible Use of Airspace |
| IFPS / IFPZ | Integrated Initial Flight Plan Processing System / IFPS Zone |
| MTOW | Maximum Take-Off Weight |
| MUAC | Maastricht Upper Area Control Centre |
| NM / NMOC | Network Manager / NM Operations Centre |
| NOP | Network Operations Plan |
| OLDI | On-Line Data Interchange |
| PRC / PRU | Performance Review Commission / Unit |
| RAD | Route Availability Document |
| REA | Ready message |
| RRP / RJT | Rerouting Proposal / Rerouting Rejection |
| SAM / SRM / SLC | Slot Allocation / Revision / Cancellation message |
| SAL / SHL | Slot Allocation List (airport coordination: Initial Slot Allocation) / Slot Historic List. CASA also uses "SAL" for its own slot list |
| SID / STAR | Standard Instrument Departure / Standard Terminal Arrival Route |
| SIP / SPA / SRJ / SWM | Slot Improvement Proposal / Acceptance / Rejection / SIP Wanted Message |
| STAM | Short-Term ATFCM Measures |
| TOBT / TSAT / TTOT | Target Off-Block / Start-up Approval / Take-Off Time |
| WASG | Worldwide Airport Slot Guidelines |

---

## 13. "Wow" data facts for the visualisation (suggestions)

1. **"One every 2.3 seconds."** On the record day, **37,034 flights** flew in the network (18 July 2025) [S1]. That is one new flight about every 2.3 seconds over 24 hours (derived). *Visual:* a 24-hour clock filling with dots.
2. **"112 slots on a conveyor belt."** A 4-hour regulation at 28 flights/hour creates 112 slots about 2 minutes apart, and filing a flight plan is itself a slot request [S7]. *Visual:* the hero plane sliding back along the belt when the SAM arrives, with the -5/+10 tolerance shown as a tiny window.
3. **"100,000 messages, 99% untouched by humans."** IFPS handles up to 100,000 flight-plan messages a day. Only about 1,000 need a person [S10]. *Visual:* a stream of messages with a few pulled out into a manual queue.
4. **"Switzerland: 18% of the distance, 31% of the bill."** The illustrative route-charge split for BRU to FCO, using 2026 unit rates of 167.12 EUR (CH) vs 73.71 EUR (IT) [S34]. *Visual:* a stacked bar of distance against a stacked bar of euros.
5. **"58% of en-route delay is about people and capacity, not weather."** 2025 shares: capacity & staffing 58%, weather 28% [S1]. Another option: **"Every 6th European flight passes Maastricht"** (>16% in 2025) [S5].

---

## 14. Key uncertainties and open items
- **IFPS location:** the brief's "Haren/Brétigny" is outdated. IFPS has run from Brussels only since 30 November 2020 [S10].
- **Belgian coordinator:** it is **BSC (Belgium Slot Coordination)**, not "BSCA" [S26].
- **Number of ACCs and sectors in Europe:** not confirmed from a current primary source `[unverified]`.
- **NM staff headcount:** not found `[unverified]`.
- **The real filed route for BRU to FCO** (SID, STAR, waypoints) was not verified. FlightAware and similar sites block automated access. Use a real NM/RAD-compliant route from a flight-planning tool before drawing the map.
- **Brussels A-CDM date (29/06/2010)** comes from a search snippet of the EUROCONTROL Airport Corner listing. The page itself was not opened.
- **Typical cruise level, fuel burn and turnaround time** are rule-of-thumb values `[unverified]`.

---

## Sources

| id | title | publisher | url | accessed |
|---|---|---|---|---|
| S1 | European Aviation Overview – 2025 Review (23 Jan 2026) | EUROCONTROL | https://www.eurocontrol.int/sites/default/files/2026-01/eurocontrol-european-aviation-overview-20260123-2025-review.pdf | 2026-10-09 |
| S2 | About us | EUROCONTROL | https://www.eurocontrol.int/about-us | 2026-10-09 |
| S3 | Network Manager Annual Report 2025 | EUROCONTROL | https://www.eurocontrol.int/publication/eurocontrol-network-manager-annual-report-2025 | 2026-10-09 |
| S4 | Annual Network Operations Report 2025 | EUROCONTROL | https://www.eurocontrol.int/publication/annual-network-operations-report-2025 | 2026-10-09 |
| S5 | MUAC Annual Report 2025 | EUROCONTROL MUAC | https://www.eurocontrol.int/archive_download/all/node/16131 | 2026-10-09 |
| S6 | MUAC reports strong performance in 2025, safely handling over 1.8 million flights | EUROCONTROL | https://www.eurocontrol.int/press-release/eurocontrol-muac-reports-strong-performance-2025-safely-handling-over-18-million | 2026-10-09 |
| S7 | ATFCM Users Manual (edition 22-04-2026) | EUROCONTROL NM | https://www.eurocontrol.int/publication/atfcm-users-manual | 2026-10-09 |
| S8 | ATFCM Operations Manual (Wave 2.3, 22-04-2026) | EUROCONTROL NM | https://www.eurocontrol.int/publication/atfcm-operations-manual | 2026-10-09 |
| S9 | IFPS Users Manual (Wave 2.3, Apr 2026) | EUROCONTROL NM | https://www.eurocontrol.int/sites/default/files/2026-04/eurocontrol-ifps-user-manual-wave-2-3-external.pdf | 2026-10-09 |
| S10 | EUROCONTROL centralises all flight plan processing in Brussels | EUROCONTROL | https://www.eurocontrol.int/news/eurocontrol-centralises-all-flight-plan-processing-brussels | 2026-10-09 |
| S11 | AIP Ireland ENR 1.9 – ATFM | AirNav Ireland | https://www.airnav.ie/AIRAC_MAY_2026/2026-05-14-AIRAC/html/eAIP/EI-ENR-1.9-en-IE.html | 2026-10-09 |
| S12 | AIP Ireland ENR 1.10 – Flight Planning | AirNav Ireland | https://www.airnav.ie/AIRAC_MAY_2026/2026-05-14-AIRAC/html/eAIP/EI-ENR-1.10-en-IE.html | 2026-10-09 |
| S13 | Airport CDM Implementation Manual v5.0 | EUROCONTROL | https://www.eurocontrol.int/archive_download/all/node/10373 | 2026-10-09 |
| S14 | Airport collaborative decision-making (concept page) | EUROCONTROL | https://www.eurocontrol.int/concept/airport-collaborative-decision-making | 2026-10-09 |
| S15 | Airport Corner – A-CDM / Advanced Tower implementation | EUROCONTROL | https://ext.eurocontrol.int/airport_corner_public/strategic/airport_cdm_adv_twr_impl | 2026-10-09 |
| S16 | Press release: A-CDM at Roma Fiumicino (ENAV–ADR) | ENAV | https://www.enav.it/en/node/15190 | 2026-10-09 |
| S17 | Route Availability Document (RAD) | EUROCONTROL NM | https://www.nm.eurocontrol.int/RAD/ | 2026-10-09 |
| S18 | Free route airspace (FRA) implementation projection charts | EUROCONTROL | https://www.eurocontrol.int/publication/free-route-airspace-fra-implementation-projection-charts | 2026-10-09 |
| S19 | Flexible Use of Airspace (FUA) AMC/CADF Operations Manual | EUROCONTROL | https://www.eurocontrol.int/publication/flexible-use-airspace-fua-amccadf-operations-manual | 2026-10-09 |
| S20 | Commission Implementing Regulation (EU) 2019/123 (ATM network functions) | EUR-Lex | https://eur-lex.europa.eu/eli/reg_impl/2019/123/oj/eng | 2026-10-09 |
| S21 | Council Regulation (EEC) No 95/93 (slot allocation) | EUR-Lex / legislation.gov.uk copy | https://eur-lex.europa.eu/eli/reg/1993/95/oj | 2026-10-09 |
| S22 | Worldwide Airport Slot Guidelines (WASG) | IATA / ACI / WWACG | https://www.iata.org/en/programs/ops-infra/slots/slot-guidelines/ | 2026-10-09 |
| S23 | Fact Sheet – Airport Slots (June 2026) | IATA | https://www.iata.org/en/iata-repository/pressroom/fact-sheets/fact-sheet-airport-slots | 2026-10-09 |
| S24 | 158th IATA Slot Conference (event page; SC159 linked) | IATA | https://www.iata.org/en/events/all/iata-slot-conference-158 | 2026-10-09 |
| S25 | Working Procedure Slot Allocation S25 | Airport Coordination Netherlands (ACNL) | https://slotcoordination.nl/wp-content/uploads/2024/09/20240911-WP-Slot-Allocation-S25-v1.0.pdf | 2026-10-09 |
| S26 | Slot coordination at Brussels Airport (BSC) | FPS Mobility and Transport (Belgium) | https://mobilit.belgium.be/de/node/1427 | 2026-10-09 |
| S27 | Bande orarie (slot) – Assoclearance | ENAC (Italian CAA) | https://www.enac.gov.it/trasporto-aereo/compagnie-aeree/bande-orarie-slot/ | 2026-10-09 |
| S28 | 5 things you (probably) didn't know about air traffic control | skeyes | https://www.skeyes.be/w/5-things-you-probably-didn-t-know-about-air-traffic-control | 2026-10-09 |
| S29 | MUAC raises division flight level in BE/LUX upper airspace | EUROCONTROL | https://www.eurocontrol.int/news/muac-raises-division-flight-level-be-lux-upper-airspace | 2026-10-09 |
| S30 | We manage Italian airspace | ENAV | https://www.enav.it/en/what-we-do/we-manage-italian-airspace | 2026-10-09 |
| S31 | Skyguide (secondary) | Wikipedia | https://en.wikipedia.org/wiki/Skyguide | 2026-10-09 |
| S32 | Information circular 2025/01 – EUROCONTROL Route Charges System | EUROCONTROL CRCO | https://www.eurocontrol.int/sites/default/files/2024-12/circ-2025-01-eurocontrol-route-charges-system.pdf | 2026-10-09 |
| S33 | Commission Implementing Regulation (EU) 2019/317, Annex (charging scheme formula) | EUR-Lex / legislation.gov.uk copy | https://eur-lex.europa.eu/eli/reg_impl/2019/317/oj ; https://www.legislation.gov.uk/eur/2019/317/annex/VIII/adopted | 2026-10-09 |
| S34 | Adjusted unit rates applicable to October 2026 flights | EUROCONTROL CRCO | https://www.eurocontrol.int/sites/default/files/2026-10/ur2610.pdf | 2026-10-09 |
| S35 | A320neo specifications | Airbus | https://aircraft.airbus.com/en/aircraft/a320-family/a320neo | 2026-10-09 |
| S36 | All-Causes Delays to Air Transport in Europe – Annual 2024 (CODA Digest) | EUROCONTROL | https://www.eurocontrol.int/publication/all-causes-delays-air-transport-europe-annual-2024 | 2026-10-09 |
| S37 | Performance Review Commission | EUROCONTROL PRU (ansperformance.eu) | https://ansperformance.eu/about/prc/ | 2026-10-09 |
| S38 | Aviation Intelligence Portal | EUROCONTROL | https://ansperformance.eu/ | 2026-10-09 |
| S39 | New functionalities added to EUROCONTROL Data app | EUROCONTROL | https://www.eurocontrol.int/news/new-functionalities-added-eurocontrol-data-app-including-top-airline-metrics | 2026-10-09 |
| S40 | 24.4 million passengers at Brussels Airport in 2025 | Brussels Airport Company | https://www.brusselsairport.be/en/pressroom/news/traffic-results-2025 | 2026-10-09 |
| S41 | Fiumicino exceeds 50 million passengers in one year for the first time | Il Sole 24 Ore (secondary; ADR announcement) | https://en.ilsole24ore.com/art/fiumicino-exceeds-50-million-passengers-one-year-and-first-time-AIEZBSW | 2026-10-09 |
| S42 | Datalink FAQs (Reg. 29/2009) | EASA | https://www.easa.europa.eu/en/the-agency/faqs/datalink | 2026-10-09 |
| S43 | Guidelines for On-Line Data Interchange (OLDI) 1.2 | EUROCONTROL | https://www.eurocontrol.int/sites/default/files/2023-06/eurocontrol-guidelines-for-on-line-data-interchange-oldi-1.2_0.pdf | 2026-10-09 |
| S44 | Flight Dispatcher Days 2025 – FF-ICE regulatory requirements | EUROCONTROL | https://www.eurocontrol.int/sites/default/files/2025-03/eurocontrol-flight-dispatcher-days-2025-ff-ice-regulatory-requirements.pdf | 2026-10-09 |
| S45 | Preferential Runway System (PRS) | Brussels Airport Traffic Control info (batc.be) | https://batc.be/en/runways-in-use/how-are-runways-selected/preferential-runway-system-prs | 2026-10-09 |
| S46 | Belgian AIP Amendment 2025/002 (SIDs EBBR) | skeyes | https://ops.skeyes.be/html/belgocontrol_static/eaip/eAIP_Main/pdf/EB_Amdt_2025_002_en.pdf | 2026-10-09 |
| S47 | Rome Fiumicino Airport (secondary) | Wikipedia | https://en.wikipedia.org/wiki/Rome_Fiumicino_Airport | 2026-10-09 |
| S48 | ATM Cost-Effectiveness (ACE) Benchmarking Report 2024 edition | EUROCONTROL PRU | https://www.eurocontrol.int/publication/air-traffic-management-cost-effectiveness-ace-benchmarking-report-2024-edition | 2026-10-09 |
| S49 | Brazil–Europe ANS comparison: system overview | EUROCONTROL PRU | https://euctrl-pru.github.io/international-BRA-EUR-2025/02-system-overview.html | 2026-10-09 |
| S50 | LIRF–EBBR route distance (secondary) | 1FLT | https://www.1flt.com/routes/lirf-ebbr | 2026-10-09 |
| S51 | Brussels Airlines flight 3175 information (secondary) | Travelocity | https://www.travelocity.com/es/lp/flights-info/sn/3175/Brussels-Airlines-3175-flight-information | 2026-10-09 |
