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
      { incident_date: '2025-01-29', incident_time: '16:50', day_of_week: 'Wednesday', time_band: 'PM', antecedent_codes: ['DE','RO','OP'], behaviour_codes: ['DB','PA','PD'], consequence_codes: ['EM','RD','DI'], narrative: 'Returned home after own GP appointment then waiting in surgery while peer had appointment. Became impatient — ripping book, jumping on chair. Ran around home, kneed wall, ripped book pages, climbed onto headboard, jumped down stairs, tried to flip dining table. Redirected to trampoline. Hit table at dinner.' },
      { incident_date: '2025-02-22', incident_time: '23:48', day_of_week: 'Saturday', time_band: 'Night', antecedent_codes: ['BN'], behaviour_codes: ['SH','PD','DB'], consequence_codes: ['EM','PS'], narrative: 'Night incident. Coughing in sleep. Woke jumping repeatedly on back to mattress, hitting himself on bedroom floor, punching bedroom window glass, broke bed-frame base, somersaulting on mattress. Looking at bruising on shin. Eventually settled after a shower.' },
      { incident_date: '2025-03-17', incident_time: '18:00', day_of_week: 'Monday', time_band: 'Evening', antecedent_codes: ['BN','OP','TR'], behaviour_codes: ['PA','SH','PD'], consequence_codes: ['RD','EM'], narrative: 'Came home from school. Impatient waiting for dinner — peers had received food. Given snack. After making coffee became heightened, kneed walls, hit hand against table, ran into wall, used staff arm as surface to headbutt twice. Taken outside, regulated on swing, FaceTime with mum further calmed.' },
      { incident_date: '2025-03-26', incident_time: '19:15', day_of_week: 'Wednesday', time_band: 'Evening', antecedent_codes: ['AT','RO'], behaviour_codes: ['PD','DB','SH'], consequence_codes: ['EM','RD'], narrative: 'After mum FaceTime where MR would not engage. Ran out of room visibly upset. Locked himself in toilet, broke mirror. Threw himself on staircase, banging walls. Broke DVD and electric heater leg. Calmed in garden on swing.' },
      { incident_date: '2025-04-24', incident_time: '19:00', day_of_week: 'Thursday', time_band: 'Evening', antecedent_codes: ['AT','DE'], behaviour_codes: ['SH','PD','DB'], consequence_codes: ['PS','RD','EM'], narrative: 'After mum FaceTime. TV would not work. Stood on window sill, jumped onto bed. Threw himself down stairs. Punching walls. Ran at staff. Tried to bite football. Took 30 mins to regulate on swing.' },
      { incident_date: '2025-05-17', incident_time: '17:10', day_of_week: 'Saturday', time_band: 'Evening', antecedent_codes: ['DA','DE'], behaviour_codes: ['PD','SH','DB'], consequence_codes: ['DI','RD','EM'], narrative: 'Could not find remote. Carried TV downstairs, ran into dining room and pinched screen — broke it. Asked for community trampoline, told no. Shoulder-barging staff, headbutting attempts, throwing self down stairs, throwing things in garden. Distraction with swing.' },
      { incident_date: '2025-10-03', incident_time: '15:15', day_of_week: 'Friday', time_band: 'PM', antecedent_codes: ['DA','RO'], behaviour_codes: ['PD','SH','DB'], consequence_codes: ['EM','RD'], narrative: 'Unsettled returning from trampoline park. Wanted Xbox, unavailable. Accepted DVD player. Few minutes later went to office for stapler — no staples. Upset, ran into living room. Kicking, ripping umbrella, jumping in hot tub, throwing guitar and chairs. Calmed in garden.' },
      { incident_date: '2025-10-21', incident_time: '10:30', day_of_week: 'Tuesday', time_band: 'AM', antecedent_codes: ['DA','NS'], behaviour_codes: ['AB','PD','SH','DB'], consequence_codes: ['RD'], narrative: 'At park — could not fit in baby swing. Signed too big. Hit park bins. Asked for trampoline park on iPad — told soon, not today. Ran across road, attempted to hit oncoming car. Hitting head with hands. Returned home in car, regulated on swing.' },
      { incident_date: '2025-10-29', incident_time: '16:20', day_of_week: 'Wednesday', time_band: 'PM', antecedent_codes: ['TR','RO'], behaviour_codes: ['PA','SH','PD'], consequence_codes: ['PS','RD','EM'], narrative: 'Transition between activities triggered escalation. Stomping, hitting himself. Physical support needed briefly. Redirected to garden, regulated on swing within 20 minutes.' },
      { incident_date: '2025-12-07', incident_time: '12:30', day_of_week: 'Sunday', time_band: 'PM', antecedent_codes: ['DA','DE'], behaviour_codes: ['SH','DB'], consequence_codes: ['PS','RD','RI'], narrative: 'Attempting backward rolls down stairs at top of flight. Staff used caring C technique to prevent roll. Redirected to sensory room then garden. Restrictive intervention brief and documented.' },
      { incident_date: '2025-12-12', incident_time: '13:00', day_of_week: 'Friday', time_band: 'PM', antecedent_codes: ['DA'], behaviour_codes: ['AB','PD'], consequence_codes: ['PS','PR'], narrative: 'During gate installation. Ran toward road. Staff used palms-only hand holds and help-hands technique to return to home safely.' },
      { incident_date: '2026-02-18', incident_time: '12:30', day_of_week: 'Wednesday', time_band: 'PM', antecedent_codes: ['OP','NS'], behaviour_codes: ['PA','PD','SH'], consequence_codes: ['PS','RD'], narrative: 'At trampoline park with peer. Peer became dysregulated nearby. MR escalated — hitting surfaces, self-hitting. Physical support to keep safe. Returned to home, regulated on swing.' },
      { incident_date: '2026-04-21', incident_time: '15:30', day_of_week: 'Tuesday', time_band: 'PM', antecedent_codes: ['BN','TR'], behaviour_codes: ['SH','DB'], consequence_codes: ['EM','RD'], narrative: 'Transition after afternoon activity. Visibly tired and dysregulated. Throwing himself, hitting head. Staff used empathy and low-demand approach. Regulated on swing and trampoline.' },
    ]

    await supabaseAdmin
      .from('incidents')
      .insert(mrIncidents.map(i => ({ ...i, user_id: userId, young_person_id: mrId })))

    // Insert JT incidents (4 total)
    const jtIncidents = [
      { incident_date: '2026-04-15', incident_time: '10:00', day_of_week: 'Wednesday', time_band: 'AM', antecedent_codes: ['DE','RO'], behaviour_codes: ['SI','NO'], consequence_codes: ['EM','RD'], narrative: 'Morning routine disrupted — school transport arrived early. JT refused to engage, became verbally aggressive. Went to bedroom and scratched arms. Staff gave space then used empathy and low-demand approach. Settled after 20 minutes.' },
      { incident_date: '2026-04-28', incident_time: '08:15', day_of_week: 'Tuesday', time_band: 'AM', antecedent_codes: ['DE','RO'], behaviour_codes: ['SH','NO'], consequence_codes: ['EM','CF'], narrative: 'Phone confiscated evening before due to misuse. JT woke dysregulated, refused breakfast, hit head against wall twice. Change of face — SC arrived, used humour and playful approach. JT regulated within 15 minutes and agreed to attend school.' },
      { incident_date: '2026-04-20', incident_time: '19:45', day_of_week: 'Monday', time_band: 'Evening', antecedent_codes: ['DA','NS'], behaviour_codes: ['PD','AB'], consequence_codes: ['EM','RD','PS'], narrative: 'Gaming time ended by staff. JT became immediately dysregulated, threw controller at wall, ran out of front door. Staff followed at distance. JT walked to end of street, sat on wall, accepted staff presence after 10 minutes. Returned home voluntarily.' },
      { incident_date: '2026-05-02', incident_time: '14:30', day_of_week: 'Saturday', time_band: 'PM', antecedent_codes: ['TR','DA'], behaviour_codes: ['PD','DB'], consequence_codes: ['EM','DI','RD'], narrative: 'Transition from outing back to home. JT wanted to stay out longer but transport arrived. Knocked over plant pot on return, paced aggressively. Staff offered choice of activities. JT chose gaming and settled within 30 minutes.' },
    ]

    await supabaseAdmin
      .from('incidents')
      .insert(jtIncidents.map(i => ({ ...i, user_id: userId, young_person_id: jtId })))

    // Insert Review Periods for MR
    const reviewPeriods = [
      { label: 'Review 1: 20 Jan – 19 May 2025', date_from: '2025-01-20', date_to: '2025-05-19' },
      { label: 'Review 2: 20 May – 19 Aug 2025', date_from: '2025-05-20', date_to: '2025-08-19' },
      { label: 'Review 3: 20 Aug – 19 Nov 2025', date_from: '2025-08-20', date_to: '2025-11-19' },
      { label: 'Review 4: 20 Nov 2025 – 19 Feb 2026', date_from: '2025-11-20', date_to: '2026-02-19' },
      { label: 'Review 5: 20 Feb – 27 Apr 2026', date_from: '2026-02-20', date_to: '2026-04-27' },
    ]

    await supabaseAdmin
      .from('review_periods')
      .insert(reviewPeriods.map(rp => ({ ...rp, user_id: userId, young_person_id: mrId })))

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
