import type { ChapterDef } from './types';

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'cold-open', kicker: 'Prologue', phase: null, title: 'The sky over Europe', clockLabel: 'Now', clock: 0,
    steps: [
      { id: 'co-sky', text: 'Every dot is an aircraft over Europe, captured from the positions they broadcast shortly before this page was last built [D-opensky].' },
      { id: 'co-yesterday', text: 'The European network handled the number on screen {{date:network}}. In 2025 it handled 11.1 million flights, and on its busiest day — 18 July 2025 — 37,034: one new flight every 2.3 seconds [S1, D-eurocontrol].' },
      { id: 'co-hero', illustrative: true, text: 'None of them just took off. Behind each is a choreography of airlines, airports, air traffic controllers and EUROCONTROL’s **Network Manager**. This is the story of one: **FFS101**, a fictional 07:00 Airbus A320neo from Brussels to Rome [S35].' }
    ]
  },
  {
    id: 'strategic', kicker: 'Chapter 1', phase: 'strategic', title: 'A flight is born on paper', clockLabel: 'T−10 months', clock: 0.02,
    steps: [
      { id: 'st-schedule', illustrative: true, clock: 0.02, text: 'FFS101 first exists in an airline network plan, almost a year before it flies: a 07:00 local departure from Brussels for the Summer 2026 season, which runs from the last Sunday of March to the last Saturday of October [S25].' },
      { id: 'st-slots', clock: 0.08, text: 'Brussels Airport has been slot-coordinated since 2003: nobody takes off or lands there without an airport slot from Belgium Slot Coordination ({BSC}) [S26]. Rome Fiumicino’s come from Assoclearance [S27]. EU Regulation 95/93 and the {WASG} set the rules — including “use it or lose it” at 80% [S21, S22].' },
      { id: 'st-not-ctot', clock: 0.12, text: 'Those two airport slots — one to leave Brussels, one to land in Rome — are not the take-off “slot” a pilot apologises for on board. That one, the {CTOT}, only appears on the day itself [S7].' },
      { id: 'st-nop', clock: 0.14, text: 'Meanwhile the {NM} — EUROCONTROL, with 42 member states — agrees with every air navigation service provider ({ANSP}) how much capacity each piece of sky will offer, in the Network Operations Plan ({NOP}) [S2, S8, S3].' },
      { id: 'st-forecast', clock: 0.16, text: 'They plan for a lot of traffic. 2025 was back at 2019 levels, and EUROCONTROL’s seven-year forecast keeps climbing [S1, D-eurocontrol].' }
    ]
  },
  {
    id: 'airspace', kicker: 'Chapter 2', phase: 'strategic', title: 'Thirty-seven landlords', clockLabel: 'Months → D−1', clock: 0.2,
    steps: [
      { id: 'as-patchwork', clock: 0.2, text: 'Europe’s sky is a patchwork: 37 en-route air navigation service providers share 11.5 million km² of continental airspace [S49]. FFS101’s straight line crosses Belgium, Luxembourg, France, Switzerland and Italy.' },
      { id: 'as-rad', clock: 0.23, text: 'Airlines can’t just draw a line. The Route Availability Document ({RAD}) says which routes are open when, renewed every 28-day {AIRAC} cycle [S17]. Inside Free Route Airspace ({FRA}) — about 76 control centres by the end of 2025 — they may fly direct between entry and exit points [S18].' }
    ]
  },
  {
    id: 'week-before', kicker: 'Chapter 3', phase: 'pretactical', title: 'The week before', clockLabel: 'D−6 → D−1', clock: 0.3,
    steps: [
      { id: 'as-military', clock: 0.3, text: 'Part of the sky belongs to the military, part of the time: training zones cover about half of Belgian airspace [S28]. Under Flexible Use of Airspace ({FUA}) each country publishes tomorrow’s bookings in an Airspace Use Plan ({AUP}), which the Network Manager merges for all of Europe [S19].' },
      { id: 'as-pretactical', clock: 0.37, text: 'Six days out, the Network Manager starts comparing forecast demand with expected capacity. On the eve of the flight, at 16:00 UTC in summer, the plan moves into the live system, {ETFMS}: tomorrow becomes today [S8].' }
    ]
  },
  {
    id: 'filing', kicker: 'Chapter 4 · D−1, 17:00 UTC', phase: 'pretactical', title: 'The flight plan', clockLabel: 'D−1 · filing', clock: 0.42,
    steps: [
      { id: 'fp-file', illustrative: true, text: 'The evening before, a dispatcher files FFS101’s flight plan. It may be filed up to 120 hours ahead and, where possible, at least three hours before off-block [S9].' },
      { id: 'fp-ident', text: 'Item 7 is the callsign; item 8 says the flight follows instrument rules and is scheduled; items 9 and 10 give the aircraft type and what it can do — radios, navigation, datalink [S9].' },
      { id: 'fp-eobt', text: 'Item 13: from Brussels at 05:00 UTC. That is the {EOBT}, the estimated off-block time — the moment every later deadline counts from [S9, S7].' },
      { id: 'fp-route', text: 'Item 15 is the route: cruise speed, flight level and the points in between — here a chain of coordinates joined by direct segments, as {FRA} allows [S9, S18].' },
      { id: 'fp-other', text: 'Item 18 carries the rest: date of flight, registration and navigation approvals [S9].' },
      { id: 'fp-ifps', text: 'It goes to one place: {IFPS}, the Network Manager’s flight-plan system in Brussels — up to 100,000 messages a day, more than 99% without human hands [S10]. It checks syntax, the route against the RAD and airspace availability, then replies {ACK} [S9].' },
      { id: 'fp-distribute', text: 'Within seconds the plan reaches every air traffic control unit on the route and the flow-management system. Filing it is also, in effect, a request for a slot [S7, S9].' }
    ]
  },
  {
    id: 'twist', kicker: 'Chapter 5 · D-day, before dawn', phase: 'tactical', title: 'Too many flights, one sector', clockLabel: 'D-day · 03:00 UTC', clock: 0.5,
    steps: [
      { id: 'tw-demand', illustrative: true, text: 'Overnight the flow managers spot trouble: in a Reims sector group on FFS101’s path, more flights want to pass between 05:00 and 07:00 than its controllers can safely handle [S7].' },
      { id: 'tw-regulation', text: 'When demand exceeds capacity, the Network Manager and the local Flow Management Position ({FMP}) impose a regulation: a place, a time window and an entry rate. Four hours at 28 flights an hour make 112 slots, about two minutes apart [S7].' },
      { id: 'tw-queue', text: '{CASA}, the slot allocator, queues flights first-planned, first-served by when they would reach the sector. A flight that doesn’t fit is pushed to the next free slot — and the queue grows [S7].' },
      { id: 'tw-sam', illustrative: true, text: 'FFS101 is in that queue. At 03:00 UTC — two hours before off-block — a Slot Allocation Message ({SAM}) arrives: {CTOT} 05:42, 27 minutes late [S7].' },
      { id: 'tw-explore', text: 'Your turn: drag the sector’s capacity and watch the delay ripple through every flight in the queue. *A simplified model of CASA, not the real algorithm* [S7].' }
    ]
  },
  {
    id: 'delay', kicker: 'Zoom out', phase: 'tactical', title: 'Why Europe waits', clockLabel: 'Zoom out · Europe', clock: 0.5,
    steps: [
      { id: 'de-yesterday', text: 'FFS101 is not alone. Flow-management ({ATFM}) delay across the network added up to the minutes on screen {{date:network}} [D-eurocontrol].' },
      { id: 'de-causes', text: 'Mostly not because of weather: in 2025, ATC capacity and staffing caused 58% of en-route ATFM delay, weather 28% [S1]. The split for that day is on screen [D-eurocontrol].' },
      { id: 'de-year', text: 'Across the year the pattern repeats — summer storms and staffing peaks. France accounted for 36% of en-route delay in 2025 [S1, D-eurocontrol].' },
      { id: 'de-report', text: 'Every week the Network Manager writes up what happened. This is its latest network situation report, {{live:report}} [D-situation].' }
    ]
  },
  {
    id: 'reroute', kicker: 'Chapter 6 · D-day, 03:20 UTC', phase: 'tactical', title: 'The way around', clockLabel: 'D-day · 03:20 UTC', clock: 0.53,
    steps: [
      { id: 'rr-path', illustrative: true, text: 'The regulated sector sits right on FFS101’s planned path over north-east France — the country that generated the most en-route delay in 2025 [S1].' },
      { id: 'rr-rrp', illustrative: true, text: 'At 03:20 the Network Manager offers a Rerouting Proposal ({RRP}): east over Germany and Zurich, about 20 NM longer, with a new CTOT of 05:22 [S7]. In 2025 such reroutes saved 277,000 minutes of delay [S3].' },
      { id: 'rr-weigh', text: 'The dispatcher weighs 20 fewer minutes of delay against fuel and different route charges. In 2025, hand-picked proposals saved on average 90 NM, 450 kg of fuel and €112 per flight [S3].' },
      { id: 'rr-accept', illustrative: true, text: 'Accepted. The plan is refiled, and a Slot Revision Message ({SRM}) confirms CTOT 05:22 [S7].' }
    ]
  },
  {
    id: 'ground', kicker: 'Chapter 7 · Brussels Airport', phase: 'tactical', title: 'Everyone on one clock', clockLabel: 'Brussels · 04:00–05:24 UTC', clock: 0.56,
    steps: [
      { id: 'gr-acdm', clock: 0.56, text: 'Brussels runs Airport Collaborative Decision Making ({A-CDM}): the airport, airline, ground handlers, air traffic control and the Network Manager share one timeline of milestones [S13, S14].' },
      { id: 'gr-tobt', illustrative: true, clock: 0.58, text: 'Cleaners, caterers, fuel and baggage teams work around the aircraft while passengers board. Handler and airline commit to a Target Off-Block Time — the {TOBT} — when it will really be ready [S13].' },
      { id: 'gr-tsat', illustrative: true, clock: 0.6, text: 'Air traffic control turns all the TOBTs and slots into a start-up sequence: FFS101 gets a {TSAT} of 05:07 so it reaches the runway for its CTOT. The airport keeps the Network Manager updated with {DPI} messages [S7, S13].' },
      { id: 'gr-window', illustrative: true, clock: 0.66, text: 'The CTOT is part of the clearance: take-off no more than 5 minutes early or 10 minutes late [S7]. Wheels up at 05:24 — inside the window.' },
      { id: 'gr-punctuality', clock: 0.66, text: 'Brussels’ punctuality, day by day [D-eurocontrol]. In 2025 its departure punctuality was just below 2024 [S1].' }
    ]
  },
  {
    id: 'enroute', kicker: 'Chapter 8 · Airborne', phase: 'tactical', title: 'Five hand-overs to Rome', clockLabel: 'Airborne · 05:24–07:04 UTC', clock: 0.7,
    steps: [
      { id: 'er-skeyes', clock: 0.7, text: 'FFS101 climbs out under skeyes, the Belgian air navigation service provider, which controls the airspace up to {FL} 245 — about 7,500 m [S28].' },
      { id: 'er-muac', clock: 0.73, text: 'Above FL245 it belongs to {MUAC}, EUROCONTROL’s Maastricht centre for the upper airspace of Belgium, the Netherlands, Luxembourg and north-west Germany: 1.83 million flights in 2025, more than 16% of Europe’s traffic, about 60% of clearances by datalink ({CPDLC}) [S5, S6].' },
      { id: 'er-handovers', illustrative: true, clock: 0.78, text: 'Then Germany’s Karlsruhe centre, Zurich, and Italy’s Milano and Roma centres. Each hand-over is agreed computer-to-computer with {OLDI} messages before the pilot changes frequency [S43, S30].' },
      { id: 'er-charges', clock: 0.8, text: 'Every country crossed sends a bill. EUROCONTROL’s Central Route Charges Office ({CRCO}) charges per zone: distance ÷ 100 × √({MTOW}/50) × the zone’s unit rate [S32, S33].' },
      { id: 'er-switzerland', clock: 0.8, text: 'Switzerland charges €167.12 per unit, Italy €73.71 [S34]. On the original route Switzerland is about 18% of the distance but about 32% of the bill. Europe-wide, €11.8 billion of en-route charges were billed in 2025 [S1].' }
    ]
  },
  {
    id: 'arrival', kicker: 'Chapter 9 · Rome Fiumicino', phase: 'tactical', title: 'On blocks', clockLabel: 'Rome · 07:04 UTC', clock: 0.86,
    steps: [
      { id: 'ar-descent', illustrative: true, text: 'Some 200 km out, FFS101 starts down. ENAV’s Roma controllers fit it into Fiumicino’s arrival sequence [S30].' },
      { id: 'ar-onblocks', illustrative: true, text: 'Landing at 07:04, on blocks at 07:12 — seven minutes after schedule. By the industry’s 15-minute definition that counts as on time, like 76.1% of arrivals in 2025 [S1].' },
      { id: 'ar-fco', text: 'Fiumicino averaged 884 flights a day in 2025 and improved its departure punctuality by 10 percentage points [S1]. Its punctuality, day by day [D-eurocontrol].' }
    ]
  },
  {
    id: 'postops', kicker: 'Chapter 10 · After landing', phase: 'postops', title: 'The flight becomes data', clockLabel: 'T+1 day → T+1 year', clock: 0.92,
    steps: [
      { id: 'po-analysis', clock: 0.92, text: 'The flight is over; its data life begins. Post-operations analysis compares plan with reality and feeds the lessons into the next season’s plan [S8].' },
      { id: 'po-billing', clock: 0.95, text: 'Delay is attributed to the regulation and its cause, and all-causes delay is collected by {CODA} [S36]. The {CRCO} bills the route actually flown [S32]. The Performance Review Commission ({PRC}) reports on the year [S37].' },
      { id: 'po-matrix', clock: 0.97, text: 'Thirteen kinds of stakeholders touched FFS101 — most of them invisible from seat 14C [S7, S13].' },
      { id: 'po-co2', clock: 0.98, text: 'The climate cost is counted too: gate-to-gate CO₂ in the network reached 216 Mt in 2025 [S1]. On screen, the Data app’s CO₂ and departures indices [D-eurocontrol].' },
      { id: 'po-everyone', clock: 1, text: 'More than 30,000 flights a day go through the same choreography [S3]. Here is this year’s traffic for each control provider on FFS101’s path [D-eurocontrol].' }
    ]
  }
];

export function chapter(id: string): ChapterDef {
  const c = CHAPTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown chapter ${id}`);
  return c;
}
