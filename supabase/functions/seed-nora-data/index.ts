import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, email } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let userId = user_id

    if (!userId && email) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers()
      const found = users?.users?.find((u: any) => u.email === email)
      if (!found) {
        return new Response(JSON.stringify({ error: `No user found with email: ${email}` }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      userId = found.id
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id or email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user already has data
    const { data: existing } = await supabaseAdmin
      .from('young_persons')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: 'User already has data, skipping seed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert Young Person 1: MR
    const { data: mr } = await supabaseAdmin
      .from('young_persons')
      .insert({
        user_id: userId,
        initials: 'MR',
        home_name: 'Willow Lodge',
        date_of_admission: '2025-01-20',
        notes: 'Profoundly deaf, non-verbal, autistic, severe learning disability, ADHD, epilepsy onset Oct 2025 now controlled on Levetiracetam. Uses BSL, Makaton, gestures, iPad (GRIDS app, Google Maps). Strong sensory seeker vestibular and proprioceptive. Primary regulator is garden swing. Key relationships HC and BM keyworkers.',
      })
      .select('id')
      .single()

    const mrId = mr!.id

    // Insert Young Person 2: JT
    const { data: jt } = await supabaseAdmin
      .from('young_persons')
      .insert({
        user_id: userId,
        initials: 'JT',
        home_name: 'Oakwood House',
        date_of_admission: '2024-09-15',
        notes: '14 year old, history of trauma and attachment difficulties. Verbal and communicative. Main triggers are transitions and denied access to technology. Responds well to low-demand approach and humour. Key relationship with keyworker SC.',
      })
      .select('id')
      .single()

    const jtId = jt!.id

    // Insert Young Person 3: KL
    await supabaseAdmin
      .from('young_persons')
      .insert({
        user_id: userId,
        initials: 'KL',
        home_name: 'Oakwood House',
        date_of_admission: '2025-06-01',
        notes: '16 year old, supported accommodation. Anxiety and low mood. Working toward independence. No significant incidents to date.',
      })

    // Insert MR incidents (13 total)
    const mrIncidents = [
      { incident_date: '2025-01-29', incident_time: '16:50', day_of_week: 'Wednesday', time_band: 'PM', antecedent_codes: ['DE','RO','OP'], behaviour_codes: ['DB','PA','PD'], consequence_codes: ['EM','RD','DI'], log_reference: 'INC-2025-0041', narrative: 'Returned home after own GP appointment then waiting in surgery while peer had appointment. Became impatient — ripping book, jumping on chair. Ran around home, kneed wall, ripped book pages, climbed onto headboard, jumped down stairs, tried to flip dining table. Redirected to trampoline. Hit table at dinner.' },
      { incident_date: '2025-02-22', incident_time: '23:48', day_of_week: 'Saturday', time_band: 'Night', antecedent_codes: ['BN'], behaviour_codes: ['SH','PD','DB'], consequence_codes: ['EM','PS'], narrative: 'Night incident. Coughing in sleep. Woke jumping repeatedly on back to mattress, hitting himself on bedroom floor, punching bedroom window glass, broke bed-frame base, somersaulting on mattress. Looking at bruising on shin. Eventually settled after a shower.' },
      { incident_date: '2025-03-17', incident_time: '18:00', day_of_week: 'Monday', time_band: 'Evening', antecedent_codes: ['BN','OP','TR'], behaviour_codes: ['PA','SH','PD'], consequence_codes: ['RD','EM'], log_reference: 'INC-2025-0067', narrative: 'Came home from school. Impatient waiting for dinner — peers had received food. Given snack. After making coffee became heightened, kneed walls, hit hand against table, ran into wall, used staff arm as surface to headbutt twice. Taken outside, regulated on swing, FaceTime with mum further calmed.' },
      { incident_date: '2025-03-26', incident_time: '19:15', day_of_week: 'Wednesday', time_band: 'Evening', antecedent_codes: ['AT','RO'], behaviour_codes: ['PD','DB','SH'], consequence_codes: ['EM','RD'], narrative: 'After mum FaceTime where MR would not engage. Ran out of room visibly upset. Locked himself in toilet, broke mirror. Threw himself on staircase, banging walls. Broke DVD and electric heater leg. Calmed in garden on swing.' },
      { incident_date: '2025-04-24', incident_time: '19:00', day_of_week: 'Thursday', time_band: 'Evening', antecedent_codes: ['AT','DE'], behaviour_codes: ['SH','PD','DB'], consequence_codes: ['PS','RD','EM'], log_reference: 'INC-2025-0089', narrative: 'After mum FaceTime. TV would not work. Stood on window sill, jumped onto bed. Threw himself down stairs. Punching walls. Ran at staff. Tried to bite football. Took 30 mins to regulate on swing.' },
      { incident_date: '2025-05-17', incident_time: '17:10', day_of_week: 'Saturday', time_band: 'Evening', antecedent_codes: ['DA','DE'], behaviour_codes: ['PD','SH','DB'], consequence_codes: ['DI','RD','EM'], narrative: 'Could not find remote. Carried TV downstairs, ran into dining room and pinched screen — broke it. Asked for community trampoline, told no. Shoulder-barging staff, headbutting attempts, throwing self down stairs, throwing things in garden. Distraction with swing.' },
      { incident_date: '2025-10-03', incident_time: '15:15', day_of_week: 'Friday', time_band: 'PM', antecedent_codes: ['DA','RO'], behaviour_codes: ['PD','SH','DB'], consequence_codes: ['EM','RD'], log_reference: 'INC-2025-0103', narrative: 'Unsettled returning from trampoline park. Wanted Xbox, unavailable. Accepted DVD player. Few minutes later went to office for stapler — no staples. Upset, ran into living room. Kicking, ripping umbrella, jumping in hot tub, throwing guitar and chairs. Calmed in garden.' },
      { incident_date: '2025-10-21', incident_time: '10:30', day_of_week: 'Tuesday', time_band: 'AM', antecedent_codes: ['DA','NS'], behaviour_codes: ['AB','PD','SH','DB'], consequence_codes: ['RD'], narrative: 'At park — could not fit in baby swing. Signed too big. Hit park bins. Asked for trampoline park on iPad — told soon, not today. Ran across road, attempted to hit oncoming car. Hitting head with hands. Returned home in car, regulated on swing.' },
      { incident_date: '2025-10-29', incident_time: '16:20', day_of_week: 'Wednesday', time_band: 'PM', antecedent_codes: ['TR','RO'], behaviour_codes: ['PA','SH','PD'], consequence_codes: ['PS','RD','EM'], narrative: 'Transition between activities triggered escalation. Stomping, hitting himself. Physical support needed briefly. Redirected to garden, regulated on swing within 20 minutes.' },
      { incident_date: '2025-12-07', incident_time: '12:30', day_of_week: 'Sunday', time_band: 'PM', antecedent_codes: ['DA','DE'], behaviour_codes: ['SH','DB'], consequence_codes: ['PS','RD','RI'], log_reference: 'INC-2025-0118', narrative: 'Attempting backward rolls down stairs at top of flight. Staff used caring C technique to prevent roll. Redirected to sensory room then garden. Restrictive intervention brief and documented.' },
      { incident_date: '2025-12-12', incident_time: '13:00', day_of_week: 'Friday', time_band: 'PM', antecedent_codes: ['DA'], behaviour_codes: ['AB','PD'], consequence_codes: ['PS','PR'], narrative: 'During gate installation. Ran toward road. Staff used palms-only hand holds and help-hands technique to return to home safely.' },
      { incident_date: '2026-02-18', incident_time: '12:30', day_of_week: 'Wednesday', time_band: 'PM', antecedent_codes: ['OP','NS'], behaviour_codes: ['PA','PD','SH'], consequence_codes: ['PS','RD'], narrative: 'At trampoline park with peer. Peer became dysregulated nearby. MR escalated — hitting surfaces, self-hitting. Physical support to keep safe. Returned to home, regulated on swing.' },
      { incident_date: '2026-04-21', incident_time: '15:30', day_of_week: 'Tuesday', time_band: 'PM', antecedent_codes: ['BN','TR'], behaviour_codes: ['SH','DB'], consequence_codes: ['EM','RD'], narrative: 'Transition after afternoon activity. Visibly tired and dysregulated. Throwing himself, hitting head. Staff used empathy and low-demand approach. Regulated on swing and trampoline.' },
    ]

    await supabaseAdmin
      .from('incidents')
      .insert(mrIncidents.map(i => ({ ...i, user_id: userId, young_person_id: mrId })))

    // Insert JT incidents (4 total)
    const jtIncidents = [
      { incident_date: '2026-04-15', incident_time: '10:00', day_of_week: 'Wednesday', time_band: 'AM', antecedent_codes: ['DE','RO'], behaviour_codes: ['SI','NO'], consequence_codes: ['EM','RD'], log_reference: 'INC-2026-0012', narrative: 'Morning routine disrupted — school transport arrived early. JT refused to engage, became verbally aggressive. Went to bedroom and scratched arms. Staff gave space then used empathy and low-demand approach. Settled after 20 minutes.' },
      { incident_date: '2026-04-28', incident_time: '08:15', day_of_week: 'Tuesday', time_band: 'AM', antecedent_codes: ['DE','RO'], behaviour_codes: ['SH','NO'], consequence_codes: ['EM','CF'], log_reference: 'INC-2026-0028', narrative: 'Phone confiscated evening before due to misuse. JT woke dysregulated, refused breakfast, hit head against wall twice. Change of face — SC arrived, used humour and playful approach. JT regulated within 15 minutes and agreed to attend school.' },
      { incident_date: '2026-04-20', incident_time: '19:45', day_of_week: 'Monday', time_band: 'Evening', antecedent_codes: ['DA','NS'], behaviour_codes: ['PD','AB'], consequence_codes: ['EM','RD','PS'], narrative: 'Gaming time ended by staff. JT became immediately dysregulated, threw controller at wall, ran out of front door. Staff followed at distance. JT walked to end of street, sat on wall, accepted staff presence after 10 minutes. Returned home voluntarily.' },
      { incident_date: '2026-05-02', incident_time: '14:30', day_of_week: 'Saturday', time_band: 'PM', antecedent_codes: ['TR','DA'], behaviour_codes: ['PD','DB'], consequence_codes: ['EM','DI','RD'], narrative: 'Transition from outing back to home. JT wanted to stay out longer but transport arrived. Knocked over plant pot on return, paced aggressively. Staff offered choice of activities. JT chose gaming and settled within 30 minutes.' },
    ]

    await supabaseAdmin
      .from('incidents')
      .insert(jtIncidents.map(i => ({ ...i, user_id: userId, young_person_id: jtId })))

    // Insert Review Periods for MR
    const reviewPeriodsData = [
      { label: 'Review 1: 20 Jan – 19 May 2025', date_from: '2025-01-20', date_to: '2025-05-19' },
      { label: 'Review 2: 20 May – 19 Aug 2025', date_from: '2025-05-20', date_to: '2025-08-19' },
      { label: 'Review 3: 20 Aug – 19 Nov 2025', date_from: '2025-08-20', date_to: '2025-11-19' },
      { label: 'Review 4: 20 Nov 2025 – 19 Feb 2026', date_from: '2025-11-20', date_to: '2026-02-19' },
      { label: 'Review 5: 20 Feb – 27 Apr 2026', date_from: '2026-02-20', date_to: '2026-04-27' },
    ]

    const { data: insertedPeriods } = await supabaseAdmin
      .from('review_periods')
      .insert(reviewPeriodsData.map(rp => ({ ...rp, user_id: userId, young_person_id: mrId })))
      .select('id, label')

    // Quality Standards scores for MR across Reviews 1, 3, 5
    // Realistic Reg 44 data: mixed scores, some improving, some static, one deteriorating then recovering
    if (insertedPeriods && insertedPeriods.length >= 5) {
      const r1Id = insertedPeriods.find((p: any) => p.label.startsWith('Review 1'))?.id
      const r3Id = insertedPeriods.find((p: any) => p.label.startsWith('Review 3'))?.id
      const r5Id = insertedPeriods.find((p: any) => p.label.startsWith('Review 5'))?.id

      const qsScores = [
        // Review 1 — early placement, mostly Good with some RI
        { review_period_id: r1Id, regulation: 'Reg 6', score: 2, notes: 'Good quality of care. Communication needs well met with signing staff. Sensory diet in place.', assessed_date: '2025-05-18' },
        { review_period_id: r1Id, regulation: 'Reg 7', score: 3, notes: 'Two absconding incidents this period. Risk assessment needs updating following garden gate incident.', assessed_date: '2025-05-18' },
        { review_period_id: r1Id, regulation: 'Reg 8', score: 3, notes: 'Behaviour management plan in place but not yet embedded. Staff inconsistency in applying de-escalation strategies.', assessed_date: '2025-05-18' },
        { review_period_id: r1Id, regulation: 'Reg 9', score: 2, notes: 'School attendance good. Transport arrangements working well.', assessed_date: '2025-05-18' },
        { review_period_id: r1Id, regulation: 'Reg 10', score: 3, notes: 'Two instances of physical support this period. Recording needs improvement — duration not always documented.', assessed_date: '2025-05-18' },
        { review_period_id: r1Id, regulation: 'Reg 11', score: 2, notes: 'Complaints procedure accessible. No formal complaints this period.', assessed_date: '2025-05-18' },
        { review_period_id: r1Id, regulation: 'Reg 12', score: 2, notes: 'All notifications submitted within timescale.', assessed_date: '2025-05-18' },
        { review_period_id: r1Id, regulation: 'Reg 14', score: 2, notes: 'Financial records in order. Pocket money system clear and documented.', assessed_date: '2025-05-18' },
        // Review 3 — epilepsy onset creates pressure, some scores dip
        { review_period_id: r3Id, regulation: 'Reg 6', score: 2, notes: 'Quality of care maintained despite epilepsy onset. Medical appointments well coordinated. EEG referral expedited.', assessed_date: '2025-11-18' },
        { review_period_id: r3Id, regulation: 'Reg 7', score: 2, notes: 'Improved from RI. Risk assessments updated. Garden security improved. No absconding this period.', assessed_date: '2025-11-18' },
        { review_period_id: r3Id, regulation: 'Reg 8', score: 2, notes: 'PBS plan now embedded. Staff consistent in applying swing/trampoline regulatory strategies. Incidents reduced.', assessed_date: '2025-11-18' },
        { review_period_id: r3Id, regulation: 'Reg 9', score: 3, notes: 'School attendance dropped due to seizure-related absences. Medical evidence in place but pattern needs monitoring.', assessed_date: '2025-11-18' },
        { review_period_id: r3Id, regulation: 'Reg 10', score: 2, notes: 'Restraint recording improved. All instances timed and documented. Post-incident debriefs happening consistently.', assessed_date: '2025-11-18' },
        { review_period_id: r3Id, regulation: 'Reg 11', score: 2, notes: 'No complaints. Advocacy service engaged.', assessed_date: '2025-11-18' },
        { review_period_id: r3Id, regulation: 'Reg 12', score: 4, notes: 'First seizure notification late by 3 days. Second seizure notification timely. Process now clarified with all staff.', assessed_date: '2025-11-18' },
        { review_period_id: r3Id, regulation: 'Reg 14', score: 2, notes: 'No concerns.', assessed_date: '2025-11-18' },
        // Review 5 — stabilised on medication, overall improvement
        { review_period_id: r5Id, regulation: 'Reg 6', score: 1, notes: 'Outstanding quality of care. Seizure management protocol embedded. Communication system expanded with new GRIDS vocabulary. Mum relationship supported brilliantly.', assessed_date: '2026-04-26' },
        { review_period_id: r5Id, regulation: 'Reg 7', score: 1, notes: 'No missing episodes since Review 2. Environmental security robust. iPad monitoring protocol effective as early warning.', assessed_date: '2026-04-26' },
        { review_period_id: r5Id, regulation: 'Reg 8', score: 1, notes: 'PBS plan exemplary. Behaviour functions clearly understood by all staff. Incident frequency at lowest since placement. Proactive sensory scheduling embedded.', assessed_date: '2026-04-26' },
        { review_period_id: r5Id, regulation: 'Reg 9', score: 2, notes: 'School attendance recovered. Seizure protocol agreed with school. Transport contingency in place.', assessed_date: '2026-04-26' },
        { review_period_id: r5Id, regulation: 'Reg 10', score: 1, notes: 'Minimal restraint this period. When used, recording exemplary. Post-incident PACE repair documented.', assessed_date: '2026-04-26' },
        { review_period_id: r5Id, regulation: 'Reg 11', score: 2, notes: 'No complaints. Young person engaged with independent visitor.', assessed_date: '2026-04-26' },
        { review_period_id: r5Id, regulation: 'Reg 12', score: 2, notes: 'Recovered from previous Inadequate. All notifications now within 24 hours. Staff trained on notification triggers for seizures.', assessed_date: '2026-04-26' },
        { review_period_id: r5Id, regulation: 'Reg 14', score: 2, notes: 'No concerns. Additional medication costs documented and accounted for.', assessed_date: '2026-04-26' },
      ].filter(s => s.review_period_id) // safety filter

      if (qsScores.length > 0) {
        await supabaseAdmin
          .from('quality_standards_scores')
          .insert(qsScores.map(s => ({ ...s, user_id: userId, young_person_id: mrId })))
      }
    }

    // Insert MR seizures (4 total)
    const mrSeizures = [
      {
        date: '2025-10-06', time: '07:30:00', day_of_week: 'Monday',
        seizure_type: 'Tonic-clonic', duration_seconds: 60,
        notes: 'FIRST SEIZURE. Difficult to wake for school — up since 6am. Tonic-clonic seizure. Ambulance called. Hospital — discharged same day. Referred for EEG. Returned home, back to himself by evening.',
      },
      {
        date: '2025-10-14', time: '09:14:00', day_of_week: 'Tuesday',
        seizure_type: 'Tonic-clonic', duration_seconds: 60,
        notes: 'SECOND SEIZURE. Outside bedroom door — staff waiting. Came out, returned to bed, tonic-clonic seizure under covers. Stiff limbs, dribbling, unconsciousness. Paramedics called — observations normal. EEG appointment expedited to 22/10/25.',
      },
      {
        date: '2025-11-05', time: '12:20:00', day_of_week: 'Wednesday',
        seizure_type: 'Tonic-clonic', duration_seconds: 140,
        notes: 'THIRD SEIZURE. Woke happy with new book delivery. Got dressed, lots of object-tapping with mouth. Outside — fell over, tonic-clonic seizure on ground in garden. Stiff limbs, dribbling, slight vomiting, unconsciousness, frozen face. Lasted 2 minutes 20 seconds. Hospital. Discharged evening. Ambulance within 7 minutes.',
      },
      {
        date: '2025-11-24', time: '07:24:00', day_of_week: 'Monday',
        seizure_type: 'Focal', duration_seconds: 300,
        notes: 'FOURTH SEIZURE. Good night\'s sleep. After personal care, ready for school, sat on snug sofa. Began seizing 07:24 — whole body shaking, right leg only. Staff timed seizure. Ambulance called immediately. Recovery position once shaking stopped. Hospital. Now prescribed Levetiracetam 750mg twice daily granules. Seizure-free since this date.',
      },
    ]

    await supabaseAdmin
      .from('seizures')
      .insert(mrSeizures.map(s => ({ ...s, user_id: userId, young_person_id: mrId })))

    // Insert PBS Plan for MR
    await supabaseAdmin
      .from('pbs_plans')
      .insert({
        user_id: userId,
        young_person_id: mrId,
        enjoys: 'Swimming and water play — strong confident swimmer, visibly happy in the pool. Bouncing on the trampoline and using the swing in the garden. Travelling by car to preferred destinations. Looking at photographs of past activities on his iPad. Exploring places on Google Maps and Google Earth. Writing and drawing in his sketchbook and scrapbook. Helping prepare food, especially making coffee with sugar and milk. Mum visits and FaceTime calls. Bowling, cinema, going to bookshops and looking at Disney books. Fast intense vestibular activities. Time outdoors in the garden.',
        important_to: 'Feeling safe and emotionally held by familiar adults who can communicate with him. His relationship with his mother — daily FaceTime contact, full-day visits, physical affection. Predictable routines and knowing what is happening next. Reliable access to sensory regulation activities — swing, trampoline, garden. Consistent calm signing adults. Choice and autonomy. His communication tools — iPad, GRIDS, photographs, now/next visual systems. Time alone in his bedroom when he needs it. Reliable food access at consistent times. Connection with preferred adults HC and BM.',
        good_at: 'Communicating his needs through sign, gesture, photograph and object use. Swimming with strong confident technique. Choosing his own clothes and getting dressed. Making his own coffee with sugar and milk. Using the GRIDS app to request items. Drawing, sketching, scrapbook. Self-regulating using the swing and trampoline. Taking himself to his bedroom for personal time. Building meaningful relationships with familiar signing adults. Apologising in sign after a difficult moment. Recovering quickly after dysregulation.',
        helps_relax: 'Time on the swing — his most reliable regulator. Time on the trampoline. Personal time alone in his bedroom. Looking at his iPad — Google Maps, photographs, GRIDS. Drawing or writing in scrapbook. Driving in the car to familiar destination. FaceTime calls with mum. Deep pressure massage to feet, legs and shoulders. Heavy sensory work — climbing, pushing, carrying. Swimming. Tapping objects, walls or surfaces in a steady rhythm. A warm bath or shower. A drink of squash with ice.',
        personal_risk_factors: 'Profound congenital deafness — no access to spoken language, alarms or auditory communication. Autism Spectrum Disorder with significant impact on communication, sensory processing and emotional regulation. Severe Learning Disability impacting abstract reasoning, time concepts and complex social understanding. ADHD impacting impulse control and sustained attention. Recent onset epilepsy October 2025 currently controlled on Levetiracetam 750mg twice daily. Strong sensory-seeking profile — vestibular, proprioceptive, auditory and tactile drives that override safety judgment. Limited danger awareness. Reduced interoceptive awareness. Pre-verbal expressive language combined with deafness. Separation from mother due to her significant chronic health needs — mother currently on dialysis with kidney transplant under consideration.',
        environmental_risk_factors: 'Adults who do not sign or use long verbal communication without visual support. Inconsistent staffing. Doors, gates or windows not securely closed during transitions. Visible electronic items not stored out of reach. Busy noisy or unfamiliar community environments. Community outings shared with peers known to dysregulate alongside MR. Extended waiting periods without visual countdown supports. Routes passing close to roads, water or known preferred destinations. Environments where sensory routines are unavailable. Times of day with reduced adult capacity. Changes in his familiar adult team during high-stress routines.',
        slow_triggers: 'Accumulated denial of access to preferred technology across a day. Extended unstructured periods without clear visual scheduling. Accumulated tiredness following poor sleep. Build-up of sensory load across a busy day with limited recovery time. Repeated soon-not-now responses without visual countdown or alternative offered. Unmonitored iPad activity where MR develops strong fixation on a destination. Inconsistency between adults. Unresolved physical states MR cannot verbalise. Emotional load following mum\'s hospital appointments or visit changes.',
        fast_triggers: 'Denied access to a specific item, destination or activity MR has actively requested. Interruption of an active sensory or completion routine before finished. Removal of a preferred item from his hand without preparation. Unexpected change of plan. Loss of access to a specific familiar adult. Being told no or too big without alternative offered. Adults using long verbal explanations without sign during heightened arousal. Sudden physical contact during elevated arousal from less familiar adults. A peer becoming dysregulated in close proximity. Discovery of an opportunity to access a preferred destination. Hot food presented without cooling time.',
        behaviour_functions: [
          { name: 'Property Damage', description: 'Breaking, snapping, tearing or damaging objects including mirrors, DVDs, bed frames, televisions, umbrellas, guitars.', primary_function: 'Provides intense proprioceptive feedback consistent with sensory regulation needs. Externalises internal chaos in a tangible and visible way.', secondary_function: 'Functions communicatively — expressing a level of distress that MR cannot yet articulate verbally.' },
          { name: 'Self-Harm', description: 'Hitting own head, face or body against surfaces and staff. Throwing himself down stairs, onto mattresses and hard floors. Punching windows.', primary_function: 'Strong proprioceptive quality — provides deep pressure and vestibular input as a regulatory strategy.', secondary_function: 'Occurs in context of profound emotional pain following maternal contact or overwhelming shame and helplessness. Serves dual function as regulatory strategy and expression of internal suffering.' },
          { name: 'Physical Aggression', description: 'Using staff members as headbutting surfaces, running at staff, occasional biting attempts.', primary_function: 'Occurs at peak of dysregulation arc, not as initiating behaviour. Reflects paradoxical attachment-seeking dynamic.', secondary_function: 'Communicative rather than intentionally harmful — MR does not sustain aggression across episodes.' },
          { name: 'Absconding', description: 'Running toward roads, running from staff or premises, opportunistic flight when gates or doors are unsecured.', primary_function: 'Goal-directed behaviour — attempting to access a preferred destination or escape an aversive situation.', secondary_function: 'Limited danger awareness means safety risk is significant and not moderated by fear response.' },
          { name: 'Disruptive Behaviour', description: 'Running around home, stomping, jumping, throwing objects, general environmental disruption without targeted aggression.', primary_function: 'Sensory-seeking — vestibular and proprioceptive input through movement and impact.', secondary_function: 'Signals elevated arousal state and imminent escalation — functions as early warning behaviour.' },
        ],
        protective_factors: [
          { title: 'Strong Mum-MR Relationship', description: 'MR relationship with his mother is the central emotional anchor of his life. Daily FaceTime calls and full-day visits are consistently calm, mutually warm and behaviour-free.', how_to_use: 'Maintain daily FaceTime routine without interruption. Plan visit days well in advance using photos and visual countdown. Use social story to support MR understanding any change in mum health or visit pattern. Photograph visits and add to scrapbook.' },
          { title: 'Established Self-Regulation Through Movement', description: 'MR has a clear and reliable repertoire of self-regulating activities. He leads adults to the swing, trampoline or garden. The swing has functioned across the entire placement as his most consistent regulator.', how_to_use: 'Treat swing and trampoline access as protected daily provision not earned reward. Schedule proactive sensory regulation into the daily timetable before dysregulation occurs.' },
          { title: 'Trusted Adult Relationships', description: 'MR has formed strong attachments to keyworkers HC and BM and responds well to consistent familiar signing adults. These relationships function as a co-regulatory resource.', how_to_use: 'Prioritise continuity of keyworker allocation particularly during high-risk periods. Use change-of-face strategy proactively when primary keyworker is unavailable. Invest in reflective supervision to sustain relationship quality.' },
        ],
        proactive_strategies: 'Schedule proactive swing or trampoline access in the early evening before regulatory capacity is exhausted. Ensure preferred snack available immediately on returning home or from any community outing. Use now/next/then visual boards consistently across all adults particularly around technology access and transitions. Monitor iPad activity for Google Maps searches as a pre-cursor signal for absconding intent. Ensure all electronic items stored out of reach when not in active supervised use. Maintain consistent staffing during high-risk transition periods. Brief all staff on MR communication system — signing competency is a safety requirement. Ensure a named keyworker is present and available following every maternal FaceTime call.',
        active_strategies: 'When MR shows early signs of dysregulation — stomping, heightened movement, seeking sensory input — offer swing or garden access immediately without waiting for escalation. Use low-demand, signing approach throughout. Offer limited choices rather than open questions. Use change-of-face early if primary adult is not regulating the interaction. Maintain empathic presence throughout — do not withdraw relationally during dysregulation.',
        reactive_strategies: 'Prioritise physical safety without adding restriction where possible. Use help-hugs and caring-C techniques only where immediate physical risk requires. Guide to swing or garden as primary de-escalation pathway. Offer empathy before and during redirection — never distraction without empathy first. Allow MR personal time in bedroom to self-regulate when he initiates it. Post-incident repair using PACE. Document fully and review in supervision.',
      })

    // Insert Young Person 4: NOG (if not already present)
    const { data: existingNog } = await supabaseAdmin
      .from('young_persons')
      .select('id')
      .eq('user_id', userId)
      .eq('initials', 'NOG')
      .limit(1)

    let nogId: string
    if (existingNog && existingNog.length > 0) {
      nogId = existingNog[0].id
    } else {
      const { data: nog } = await supabaseAdmin
        .from('young_persons')
        .insert({
          user_id: userId,
          initials: 'NOG',
          home_name: 'Willow Lodge',
          date_of_admission: '2025-03-10',
          notes: 'Autism Spectrum Disorder and Global Developmental Delay. Significant speech and language delay. Chronic constipation. Continence delays. High movement needs. Emerging Makaton user. Calls staff mummy — fragile attachment. Dad visits regularly.',
        })
        .select('id')
        .single()
      nogId = nog!.id
    }

    // Insert PBS Plan for NOG (skip if already exists)
    const { data: existingNogPlan } = await supabaseAdmin
      .from('pbs_plans')
      .select('id')
      .eq('young_person_id', nogId)
      .limit(1)

    if (!existingNogPlan || existingNogPlan.length === 0) {
      await supabaseAdmin
        .from('pbs_plans')
        .insert({
          user_id: userId,
          young_person_id: nogId,
          enjoys: 'Playing with trains and cars especially watching the wheels spin at eye level. Movement-based games — chasing, ready steady go. Peek-a-boo and anticipation games. Music, nursery rhymes and dancing. Looking at books especially interactive or repetitive ones. Outdoor play — bikes, tractor, running space. Physical play with trusted adults. Bowling and park visits with his dad. Sensory play involving movement. Being around familiar adults in structured routines.',
          important_to: 'Predictable routine. Knowing what is happening next — visual preparation. Immediate response to needs especially hunger, thirst and toileting. Access to preferred items — tablet, trains, favourite toys. Physical closeness and reassurance from trusted adults. 1:1 attention and co-regulation. Seeing his dad. Familiar adults being present. Clear simple communication. Feeling understood.',
          good_at: 'Anticipation during interactive games. Showing excitement through eye contact and glancing. Building emerging shared attention. Learning and using some Makaton. Responding to go cues. Physical coordination during play. Demonstrating affection. Seeking comfort when distressed. Beginning to apologise after incidents — emerging repair skills. Engaging positively in small structured learning environments.',
          helps_relax: 'Calm predictable adult presence. Change of face — fresh adult intervention. Being taken to his bedroom or quiet space. Hugging or physical reassurance when regulated. Singing and gentle rhythmic interaction. Outdoor movement. One-to-one play. Visual supports that reduce confusion. Clear Now/Next communication. Familiar toys. Reduced noise and sensory input.',
          personal_risk_factors: 'Autism Spectrum Disorder and Global Developmental Delay. Significant speech and language delay — limited expressive and receptive language. Delayed cognitive processing. Sensory processing differences — auditory, tactile, environmental sensitivity. High movement needs and sensory seeking behaviours. Chronic constipation contributing to discomfort and behavioural escalation. Continence delays — pad use, distress during intimate care. Sleep disruption. Limited interoceptive awareness. Reduced impulse control. Early life instability and neglect concerns. Disrupted caregiving relationships. Limited ability to express needs verbally — behaviour used as communication. High dependency on adult co-regulation. Emotional regulation skills below chronological age. Emerging but fragile attachment patterns — calls staff mummy. Vulnerability in peer environments.',
          environmental_risk_factors: 'Busy noisy environments with multiple children and overlapping sensory input. Peer conflict or witnessing peers dysregulated. Unfamiliar adults or staff changes. Absence of preferred adult. Inconsistent communication approaches. Lack of visual structure. Environments where preferred items are visible but not accessible. Mealtime environments with waiting expectations. Transitions between rooms without preparation. Car journeys — restricted movement plus unpredictability. Personal care routines — pad changes are a consistently high-risk context.',
          slow_triggers: 'Constipation or physical discomfort. Poor sleep or night waking. Hunger or delayed food access. Accumulated waiting demands. Repeated exposure to no or later language. Reduced 1:1 adult attention. Emotional anticipation around contact days. Multiple small transitions across a short time period. High sensory load throughout the day. Change in routine without preparation.',
          fast_triggers: 'Being told no, wait, or later. Tablet or laptop removed or restricted. Prompt for pad change or intimate care. Being physically redirected without warning. Being asked to leave a peer\'s bedroom. Preferred item visible but not accessible. Adult blocking access to kitchen. Sudden change in adult leading activity. Loud unexpected noise. Peer invading space. Multi-step instruction delivered verbally. Physical discomfort — too hot or cold.',
          behaviour_functions: [
            { name: 'Physical Aggression Toward Adults', description: 'Hitting, slapping face, scratching, pinching, pulling clothing or glasses, biting, attempting to push adults. Historically high frequency — 22 incidents in 4 weeks at peak. Currently episodic but predictable around triggers. Most likely during demands, waiting, or personal care.', primary_function: 'Escape and avoidance — aggression most reliably occurs immediately following a demand, boundary, delay, or personal care expectation. When this occurs the consistent outcome is immediate reduction or pause in the demand.', secondary_function: 'Connection and sensory regulation — physical contact during aggression also provides proprioceptive input and proximity to adults.' },
            { name: 'Aggression During Personal Care', description: 'Kicking, biting, nail digging, spitting, prolonged resistance, crying and pushing adults away during pad changes and toileting. Highly predictable — one of the most consistent trigger contexts. High severity due to close proximity positioning.', primary_function: 'Escape and avoidance of physical and sensory discomfort — personal care involves close proximity, reduced autonomy, sensory exposure, and potential discomfort linked to constipation.', secondary_function: 'Communication of pain or vulnerability — behaviour appears to function as a direct signal that this feels uncomfortable or I cannot tolerate this right now.' },
            { name: 'Object Throwing', description: 'Throwing iPad, fork, bottle at face, household objects targeting faces. Episodic, often during frustration linked to tangible restriction. High risk — facial injury and property damage recorded.', primary_function: 'Escape from frustration and tangible access — most often occurs when access to a preferred item is restricted or a task is interrupted. Behaviour typically results in immediate adult attention and removal of the task.', secondary_function: 'Sensory discharge — throwing provides proprioceptive and vestibular input as expression of frustration when NOG experiences loss of control.' },
            { name: 'Escalation Following Boundary or Waiting', description: 'Rapid shift from calm to dysregulated. Verbal protest escalating to physical. Increased intensity when told wait. Very frequent — one of the most consistent triggers.', primary_function: 'Escape from delay and intolerance of uncertainty — NOG demonstrates limited delay tolerance and difficulty understanding abstract time concepts. Behaviour reliably shortens or removes the waiting period.', secondary_function: 'Tangible access — escalation frequently results in access to the preferred item or activity being offered as an alternative.' },
          ],
          protective_factors: [
            { title: 'Strong Interest in Trains and Cars', description: 'NOG has a highly motivating and regulating interest in trains and cars. This interest is consistent, predictable, and emotionally positive. It supports focus, engagement, and calm attention.', how_to_use: 'Use trains and cars as transition objects between activities. Build social interaction through turn-taking games. Use as a reward following tolerated waiting. Use trains visually to explain first/then sequencing. Use as grounding tool following escalation.' },
            { title: 'Positive Response to Change of Face', description: 'NOG consistently responds positively when a different adult takes over during escalation. This interrupts emotional looping and reduces relational intensity.', how_to_use: 'Plan structured change of face during early escalation not late crisis. Use fresh adult before physical behaviour emerges. Ensure second adult approaches calmly not urgently. Use as relational reset not behaviour control.' },
            { title: 'Responds to Visual Structure', description: 'NOG processes information better visually than verbally. Now/Next boards, PECS and simplified visual sequencing reduce uncertainty and prevent escalation.', how_to_use: 'Use Now/Next consistently not intermittently. Replace no/wait language with visual sequencing. Use visuals before transitions. Pre-warn of changes using visual countdown. Keep visual language simple and predictable. Ensure all adults use the same system.' },
          ],
          proactive_strategies: 'Build planned sensory regulation into NOG\'s daily routine rather than waiting for signs of dysregulation. Provide regular movement opportunities before known trigger points such as personal care, mealtimes and transitions. Use clear visual first-then and Now/Next boards to show when preferred items will be available. Provide structured timed access to high-interest items with clear visual endings — countdown or finished card. Avoid sudden restriction unless required for immediate safety. Maintain consistent key adults during high-stress routines — personal care, transitions, after contact. Build scheduled 1:1 connection time into NOG\'s day so attachment needs are proactively met. Use warm relational language alongside clear boundaries. Implement consistent prompted toileting schedule before all activities and use singing during pad changes to reduce resistance.',
          active_strategies: 'When NOG shows early signs of dysregulation reduce demands immediately. Offer a visual Now/Next to re-establish predictability. Use change of face early — before physical behaviour emerges. Introduce movement or a preferred sensory activity. Maintain calm low-arousal presence throughout. Keep language to a minimum — one word or gesture. Use singing as a regulating tool.',
          reactive_strategies: 'Prioritise safety — move other children and objects away. Use calm low-arousal body language and minimal verbal input. Change of face is the most consistently effective de-escalation strategy — use it early. Move to a quieter lower-demand environment without framing as punishment. Do not reintroduce demands during or immediately after escalation. Post-incident repair with warm reconnection, brief simple reassurance, and return to routine. No correction or consequence. For pad change resistance: use singing throughout, narrate with simple words, use two adults where needed, offer a preferred item to hold during the process.',
        })
    }

    return new Response(JSON.stringify({ success: true, message: 'Seeded data for user' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
