export interface CodeDefinition {
  code: string
  label: string
  description: string
}

export const ANTECEDENT_CODES: CodeDefinition[] = [
  { code: 'AT', label: 'Attention', description: 'The presumption of less or excessive input from others; fixation on a specific adult' },
  { code: 'BN', label: 'Basic Needs', description: 'When basic needs are not met — hunger, illness, pain, thirst, tiredness, overheating, discomfort' },
  { code: 'DE', label: 'Demands', description: 'Any request, expectation, or stressor placed on the young person; waiting' },
  { code: 'DA', label: 'Denied Access', description: 'Denied access to a preferred item, activity, location, person, food, or technology' },
  { code: 'NS', label: 'Noise/Stimulation', description: 'Level of noise or stimulation: too much or too little, over-talking, busy environments' },
  { code: 'OP', label: 'Others Present', description: 'Presence or absence of peers, members of the public, or change in group composition' },
  { code: 'RO', label: 'Routine', description: 'Changes in routine, even subtle ones; unfamiliar setting; holiday or transition periods' },
  { code: 'TR', label: 'Transitions', description: 'Process or period of changing from one state, activity or location to another' },
]

export const BEHAVIOUR_CODES: CodeDefinition[] = [
  { code: 'PA', label: 'Physical Aggression', description: 'Hitting, slapping, headbutting, kicking, pinching, biting, spitting directed at others' },
  { code: 'SH', label: 'Self-Harm', description: 'Hitting own head/face/body; throwing self at hard surfaces; jumping from heights with intent to land hard' },
  { code: 'SI', label: 'Self-Injury', description: 'Sustained self-directed physical action where injury is foreseeable and pattern continues despite intervention' },
  { code: 'DB', label: 'Disruptive Behaviour', description: 'Actions impacting the environment without targeted aggression' },
  { code: 'NO', label: 'Non-compliance', description: 'Refusal to follow direction or accept redirection' },
  { code: 'PD', label: 'Property Damage', description: 'Breaking, snapping, tearing or otherwise damaging property' },
  { code: 'AB', label: 'Absconding', description: 'Running away from staff or premises; climbing out of secure areas; opportunistic flight' },
  { code: 'SB', label: 'Sexualised Behaviour', description: 'Behaviour of a sexual nature including public undressing or self-exposure' },
  { code: 'VA', label: 'Verbal Aggression', description: 'Communicating in a challenging way including shouting, screaming, threatening language, whining, or crying without tears directed at others' },
  { code: 'RT', label: 'Rough and Tumble', description: 'Physical contact between peers with no intent to harm — wrestling, play fighting, physical play that may escalate' },
  { code: 'SM', label: 'Smearing', description: 'Deliberate spreading of faeces or urine on surfaces including walls, floors, furniture, or own body' },
]

export const CONSEQUENCE_CODES: CodeDefinition[] = [
  { code: 'AC', label: 'Acceptance', description: 'Accepting the behaviour as communication' },
  { code: 'CU', label: 'Curiosity', description: 'Asking questions to better understand the behaviour' },
  { code: 'DI', label: 'Distraction', description: 'Choosing an unrelated activity or focus' },
  { code: 'EM', label: 'Empathy', description: 'Actively showing care and support' },
  { code: 'EC', label: 'Educational Consequence', description: 'Learning that takes place as a result of the behaviour' },
  { code: 'LC', label: 'Limited Choice', description: 'Limited options presented to support processing' },
  { code: 'MI', label: 'Medical Intervention', description: 'Any type of medical intervention' },
  { code: 'NC', label: 'Natural Consequence', description: 'Things that happen without staff involvement' },
  { code: 'PL', label: 'Playful', description: 'A fun and non-assuming approach' },
  { code: 'PC', label: 'Protective Consequence', description: 'Necessary measures to manage risk of harm' },
  { code: 'PI', label: 'Planned Ignoring', description: 'Ignoring behaviour to avoid reinforcing it' },
  { code: 'PR', label: 'Positive Reinforcement', description: 'Encouraging a pattern of behaviour by offering reward' },
  { code: 'PS', label: 'Physical Support', description: 'Physical contact intended to keep safe or support' },
  { code: 'RI', label: 'Restrictive Intervention', description: 'Interventions using a level of force to limit freedom of movement' },
  { code: 'RP', label: 'Restrictive Physical Intervention', description: 'Use of force employing bodily contact to control behaviour' },
  { code: 'CF', label: 'Change of Face', description: 'A new adult introduced and takes over primary direction' },
  { code: 'RD', label: 'Redirection', description: 'Providing an alternative outlet' },
  { code: 'ID', label: 'Indirect Support', description: 'Offering demands or reflection through speaking aloud, role-play, modelling' },
  { code: 'NT', label: 'No Action Taken', description: 'No action recorded or needed' },
]

export function getCodeLabel(code: string, list: CodeDefinition[]): string {
  return list.find((c) => c.code === code)?.label ?? code
}

export function getTimeBand(time: string): string {
  const hour = parseInt(time.split(':')[0], 10)
  if (hour >= 0 && hour < 6) return 'Night'
  if (hour >= 6 && hour < 12) return 'AM'
  if (hour >= 12 && hour < 18) return 'PM'
  return 'Evening'
}

export function getDayOfWeek(date: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  // Parse yyyy-MM-dd as local date to avoid UTC timezone shift
  const [y, m, d] = date.split('-').map(Number)
  return days[new Date(y, m - 1, d).getDay()]
}
