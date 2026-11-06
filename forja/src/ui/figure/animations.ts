import type { Angles, Anim, Pose, Prop } from './rig';

/**
 * Biblioteca de animações originais. Cada chave descreve a pose inicial,
 * a pose final e os acessórios (banco, barra, halter, cabo, elástico...).
 * Os exercícios são associados a uma chave em EXERCISE_ANIM.
 */

const FLOOR: Prop = { k: 'floor' };
const stand = (a: Angles, x = 96): Pose => ({ a, anchor: 'ankle', at: [x, 186] });
const seatHip = (a: Angles, at: [number, number] = [88, 128]): Pose => ({ a, anchor: 'hip', at });
const benchSeat: Prop = { k: 'box', x: 58, y: 133, w: 52, h: 9 };
const benchLeg: Prop = { k: 'line', from: [84, 142], to: [84, 190], w: 5 };
const flatBench: Prop[] = [{ k: 'box', x: 36, y: 128, w: 104, h: 9 }, { k: 'line', from: [50, 137], to: [50, 190], w: 5 }, { k: 'line', from: [126, 137], to: [126, 190], w: 5 }];
const lie = (a: Angles, at: [number, number] = [112, 122]): Pose => ({ a, anchor: 'hip', at });
const LYING_LEGS = { thigh: 75, shin: 170 };
const UPRIGHT_SEAT = { thigh: 90, shin: 180, foot: 90 };

const goblet = { uArm: 165, fArm: 15 };
const hang = { uArm: 180, fArm: 180 };

export const ANIMS = {
  // ─── Pernas ───
  squat_goblet: { view: 'side', props: [FLOOR, { k: 'dumbbell', at: 'wrist' }], from: stand({ ...goblet }), to: stand({ shin: 205, thigh: 102, torso: 32, neck: 25, uArm: 150, fArm: 35 }) },
  squat_bar: { view: 'side', props: [FLOOR, { k: 'barbell', at: 'shoulder', size: 16 }], from: stand({ uArm: 210, fArm: 40 }), to: stand({ shin: 207, thigh: 100, torso: 38, neck: 30, uArm: 230, fArm: 70 }) },
  squat_smith: { view: 'side', props: [FLOOR, { k: 'line', from: [70, 10], to: [70, 192], w: 3 }, { k: 'barbell', at: 'shoulder', size: 16 }], from: stand({ uArm: 210, fArm: 40 }), to: stand({ shin: 205, thigh: 100, torso: 32, neck: 25, uArm: 230, fArm: 65 }) },
  squat_bw: { view: 'side', props: [FLOOR], from: stand({ uArm: 90, fArm: 90 }), to: stand({ shin: 205, thigh: 100, torso: 35, neck: 28, uArm: 85, fArm: 85 }) },
  leg_press: {
    view: 'side',
    props: [FLOOR, { k: 'line', from: [40, 160], to: [95, 120], w: 6 }, { k: 'pad', at: 'toe', r: 9 }],
    from: seatHip({ torso: -55, neck: -45, thigh: 52, shin: 52, foot: 140, uArm: 150, fArm: 120 }, [92, 128]),
    to: seatHip({ torso: -55, neck: -45, thigh: 12, shin: 140, foot: 140, uArm: 150, fArm: 120 }, [92, 128])
  },
  hack: { view: 'side', props: [FLOOR, { k: 'line', from: [60, 30], to: [96, 186], w: 5 }], from: stand({ torso: -12, uArm: 0, fArm: 30 }, 112), to: stand({ shin: 210, thigh: 98, torso: -5, uArm: 10, fArm: 40 }, 112) },
  leg_ext: { view: 'side', props: [FLOOR, benchSeat, benchLeg, { k: 'pad', at: 'ankle', r: 6 }], from: seatHip({ torso: -8, ...UPRIGHT_SEAT, uArm: 170, fArm: 160 }), to: seatHip({ torso: -8, thigh: 90, shin: 92, foot: 10, uArm: 170, fArm: 160 }) },
  lunge: {
    view: 'side', props: [FLOOR, { k: 'dumbbell', at: 'wrist' }],
    from: stand({ ...hang }, 112),
    to: stand({ ...hang, thigh: 100, shin: 180, thigh2: 200, shin2: 245, foot2: 150 }, 112)
  },
  lunge_bw: {
    view: 'side', props: [FLOOR],
    from: stand({ uArm: 160, fArm: 60 }, 112),
    to: stand({ uArm: 160, fArm: 60, thigh: 100, shin: 180, thigh2: 200, shin2: 245, foot2: 150 }, 112)
  },
  bulgarian: {
    view: 'side', props: [FLOOR, { k: 'box', x: 22, y: 140, w: 40, h: 50 }, { k: 'dumbbell', at: 'wrist' }],
    from: stand({ ...hang, thigh: 172, shin: 185, thigh2: 210, shin2: 268, foot2: 210 }, 112),
    to: stand({ ...hang, torso: 12, thigh: 108, shin: 192, thigh2: 196, shin2: 252, foot2: 200 }, 112)
  },
  step_up: {
    view: 'side', props: [FLOOR, { k: 'box', x: 88, y: 150, w: 56, h: 42 }, { k: 'dumbbell', at: 'wrist' }],
    from: { a: { ...hang, thigh: 110, shin: 180, thigh2: 190, shin2: 185 }, anchor: 'ankle', at: [104, 144] },
    to: { a: { ...hang, thigh: 180, shin: 180, thigh2: 150, shin2: 200 }, anchor: 'ankle', at: [104, 144] }
  },
  rdl: { view: 'side', props: [FLOOR, { k: 'barbell', at: 'wrist', size: 13 }], from: stand({ ...hang, shin: 186 }), to: stand({ shin: 190, thigh: 168, torso: 78, neck: 70, ...hang }) },
  rdl_db: { view: 'side', props: [FLOOR, { k: 'dumbbell', at: 'wrist' }], from: stand({ ...hang, shin: 186 }), to: stand({ shin: 190, thigh: 168, torso: 78, neck: 70, ...hang }) },
  rdl_single: {
    view: 'side', props: [FLOOR, { k: 'dumbbell', at: 'wrist' }],
    from: stand({ ...hang, shin: 186, thigh2: 190, shin2: 200 }),
    to: stand({ shin: 188, thigh: 172, torso: 82, neck: 78, ...hang, thigh2: 265, shin2: 268, foot2: 180 })
  },
  deadlift: { view: 'side', props: [FLOOR, { k: 'barbell', at: 'wrist', size: 16 }], from: stand({ shin: 212, thigh: 118, torso: 60, neck: 55, ...hang }), to: stand({ ...hang }) },
  swing: { view: 'side', props: [FLOOR, { k: 'kettlebell', at: 'wrist' }], from: stand({ shin: 192, thigh: 160, torso: 75, neck: 70, uArm: 205, fArm: 205 }), to: stand({ uArm: 95, fArm: 95 }) },
  leg_curl_lying: {
    view: 'side', props: [FLOOR, { k: 'box', x: 34, y: 128, w: 120, h: 9 }, { k: 'pad', at: 'ankle', r: 6 }],
    from: { a: { torso: 270, neck: 280, thigh: 90, shin: 90, foot: 180, uArm: 230, fArm: 270 }, anchor: 'hip', at: [100, 121] },
    to: { a: { torso: 270, neck: 280, thigh: 90, shin: -5, foot: 270, uArm: 230, fArm: 270 }, anchor: 'hip', at: [100, 121] }
  },
  leg_curl_seated: {
    view: 'side', props: [FLOOR, benchSeat, benchLeg, { k: 'pad', at: 'ankle', r: 6 }],
    from: seatHip({ torso: -15, thigh: 90, shin: 92, foot: 10, uArm: 170, fArm: 150 }),
    to: seatHip({ torso: -15, thigh: 90, shin: 205, foot: 110, uArm: 170, fArm: 150 })
  },
  nordic: {
    view: 'side', props: [FLOOR, { k: 'pad', at: 'ankle', r: 6 }],
    from: { a: { torso: 0, thigh: 180, shin: 270, foot: 180, uArm: 150, fArm: 40 }, anchor: 'knee', at: [120, 186] },
    to: { a: { torso: 38, neck: 42, thigh: 218, shin: 270, foot: 180, uArm: 120, fArm: 140 }, anchor: 'knee', at: [120, 186] }
  },
  hip_thrust: {
    view: 'side', props: [FLOOR, { k: 'box', x: 18, y: 128, w: 46, h: 64 }, { k: 'barbell', at: 'hip', size: 13 }],
    from: { a: { torso: 300, neck: 320, thigh: 40, shin: 165, uArm: 150, fArm: 120 }, anchor: 'ankle', at: [140, 186] },
    to: { a: { torso: 272, neck: 300, thigh: 92, shin: 178, uArm: 150, fArm: 120 }, anchor: 'ankle', at: [140, 186] }
  },
  glute_bridge: {
    view: 'side', props: [FLOOR],
    from: { a: { torso: 270, neck: 270, thigh: 52, shin: 165, uArm: 95, fArm: 95 }, anchor: 'ankle', at: [140, 186] },
    to: { a: { torso: 250, neck: 262, thigh: 100, shin: 172, uArm: 110, fArm: 95 }, anchor: 'ankle', at: [140, 186] }
  },
  glute_bridge_single: {
    view: 'side', props: [FLOOR],
    from: { a: { torso: 270, neck: 270, thigh: 52, shin: 165, thigh2: 52, shin2: 80, uArm: 95, fArm: 95 }, anchor: 'ankle', at: [140, 186] },
    to: { a: { torso: 250, neck: 262, thigh: 100, shin: 172, thigh2: 75, shin2: 80, uArm: 110, fArm: 95 }, anchor: 'ankle', at: [140, 186] }
  },
  kickback: {
    view: 'side', props: [FLOOR, { k: 'cable', at: 'ankle2', to: [150, 180] }],
    from: stand({ torso: 25, neck: 25, uArm: 100, fArm: 100, thigh2: 175, shin2: 185 }),
    to: stand({ torso: 25, neck: 25, uArm: 100, fArm: 100, thigh2: 230, shin2: 245 })
  },
  calf: { view: 'side', props: [FLOOR, { k: 'box', x: 102, y: 186, w: 26, h: 6 }], from: { a: { ...hang, foot: 75 }, anchor: 'toe', at: [118, 184] }, to: { a: { ...hang, foot: 140 }, anchor: 'toe', at: [118, 184] } },
  calf_db: { view: 'side', props: [FLOOR, { k: 'box', x: 102, y: 186, w: 26, h: 6 }, { k: 'dumbbell', at: 'wrist' }], from: { a: { ...hang, foot: 75 }, anchor: 'toe', at: [118, 184] }, to: { a: { ...hang, foot: 140 }, anchor: 'toe', at: [118, 184] } },
  calf_seated: {
    view: 'side', props: [FLOOR, benchSeat, benchLeg, { k: 'pad', at: 'knee', r: 6 }],
    from: { a: { torso: -5, thigh: 90, shin: 180, foot: 75, uArm: 165, fArm: 140 }, anchor: 'toe', at: [142, 188] },
    to: { a: { torso: -5, thigh: 90, shin: 180, foot: 135, uArm: 165, fArm: 140 }, anchor: 'toe', at: [142, 188] }
  },
  calf_press: {
    view: 'side', props: [FLOOR, { k: 'line', from: [40, 160], to: [95, 120], w: 6 }, { k: 'pad', at: 'toe', r: 9 }],
    from: seatHip({ torso: -55, neck: -45, thigh: 52, shin: 52, foot: 70, uArm: 150, fArm: 120 }, [92, 128]),
    to: seatHip({ torso: -55, neck: -45, thigh: 52, shin: 52, foot: 25, uArm: 150, fArm: 120 }, [92, 128])
  },

  // ─── Empurrar ───
  bench_bar: { view: 'side', props: [FLOOR, ...flatBench, { k: 'barbell', at: 'wrist', size: 13 }], from: lie({ torso: 270, neck: 275, ...LYING_LEGS, uArm: 0, fArm: 0 }), to: lie({ torso: 270, neck: 275, ...LYING_LEGS, uArm: 165, fArm: 15 }) },
  bench_db: { view: 'side', props: [FLOOR, ...flatBench, { k: 'dumbbell', at: 'wrist' }], from: lie({ torso: 270, neck: 275, ...LYING_LEGS, uArm: 0, fArm: 0 }), to: lie({ torso: 270, neck: 275, ...LYING_LEGS, uArm: 170, fArm: 10 }) },
  incline_db: {
    view: 'side', props: [FLOOR, { k: 'line', from: [56, 70], to: [100, 128], w: 8 }, benchSeat, benchLeg, { k: 'dumbbell', at: 'wrist' }],
    from: seatHip({ torso: -38, neck: -30, ...UPRIGHT_SEAT, uArm: 20, fArm: 20 }, [100, 128]),
    to: seatHip({ torso: -38, neck: -30, ...UPRIGHT_SEAT, uArm: 190, fArm: 40 }, [100, 128])
  },
  incline_bar: {
    view: 'side', props: [FLOOR, { k: 'line', from: [56, 70], to: [100, 128], w: 8 }, benchSeat, benchLeg, { k: 'barbell', at: 'wrist', size: 13 }],
    from: seatHip({ torso: -38, neck: -30, ...UPRIGHT_SEAT, uArm: 20, fArm: 20 }, [100, 128]),
    to: seatHip({ torso: -38, neck: -30, ...UPRIGHT_SEAT, uArm: 190, fArm: 40 }, [100, 128])
  },
  chest_press: {
    view: 'side', props: [FLOOR, benchSeat, benchLeg, { k: 'line', from: [64, 60], to: [64, 133], w: 7 }, { k: 'pad', at: 'wrist', r: 5 }],
    from: seatHip({ torso: -6, ...UPRIGHT_SEAT, uArm: 215, fArm: 90 }, [76, 128]),
    to: seatHip({ torso: -6, ...UPRIGHT_SEAT, uArm: 95, fArm: 90 }, [76, 128])
  },
  fly_db: { view: 'side', props: [FLOOR, ...flatBench, { k: 'dumbbell', at: 'wrist' }], from: lie({ torso: 270, neck: 275, ...LYING_LEGS, uArm: 0, fArm: 0 }), to: lie({ torso: 270, neck: 275, ...LYING_LEGS, uArm: 175, fArm: 145 }) },
  fly_front: { view: 'front', props: ['floor'], from: { uArm: 95, fArm: 100 }, to: { uArm: 160, fArm: 200 } },
  crossover: { view: 'front', props: ['floor', 'cables'], from: { uArm: 80, fArm: 95 }, to: { uArm: 160, fArm: 195 } },
  pushup: {
    view: 'side', props: [FLOOR],
    from: { a: { torso: 72, neck: 78, thigh: 252, shin: 252, foot: 170, uArm: 180, fArm: 180 }, anchor: 'toe', at: [30, 189] },
    to: { a: { torso: 84, neck: 86, thigh: 264, shin: 264, foot: 172, uArm: 245, fArm: 150 }, anchor: 'toe', at: [30, 189] }
  },
  pushup_close: {
    view: 'side', props: [FLOOR],
    from: { a: { torso: 72, neck: 78, thigh: 252, shin: 252, foot: 170, uArm: 180, fArm: 180 }, anchor: 'toe', at: [30, 189] },
    to: { a: { torso: 84, neck: 86, thigh: 264, shin: 264, foot: 172, uArm: 265, fArm: 155 }, anchor: 'toe', at: [30, 189] }
  },
  pushup_incline: {
    view: 'side', props: [FLOOR, { k: 'box', x: 128, y: 140, w: 50, h: 52 }],
    from: { a: { torso: 58, neck: 64, thigh: 238, shin: 238, foot: 160, uArm: 175, fArm: 175 }, anchor: 'toe', at: [42, 189] },
    to: { a: { torso: 68, neck: 72, thigh: 248, shin: 248, foot: 165, uArm: 230, fArm: 145 }, anchor: 'toe', at: [42, 189] }
  },
  dips: {
    view: 'side', props: [FLOOR, { k: 'line', from: [96, 104], to: [150, 104], w: 6 }, { k: 'line', from: [140, 104], to: [140, 192], w: 5 }],
    from: { a: { torso: 12, neck: 12, uArm: 180, fArm: 180, thigh: 175, shin: 215 }, anchor: 'wrist', at: [118, 104] },
    to: { a: { torso: 25, neck: 25, uArm: 235, fArm: 165, thigh: 170, shin: 215 }, anchor: 'wrist', at: [118, 104] }
  },
  bench_dips: {
    view: 'side', props: [FLOOR, { k: 'box', x: 34, y: 118, w: 50, h: 74 }],
    from: { a: { torso: 0, neck: 5, uArm: 195, fArm: 180, thigh: 90, shin: 150, foot: 60 }, anchor: 'wrist', at: [72, 118] },
    to: { a: { torso: 5, neck: 10, uArm: 260, fArm: 150, thigh: 72, shin: 150, foot: 60 }, anchor: 'wrist', at: [72, 118] }
  },
  ohp_seated: {
    view: 'side', props: [FLOOR, { k: 'line', from: [74, 60], to: [80, 133], w: 7 }, benchSeat, benchLeg, { k: 'dumbbell', at: 'wrist' }],
    from: seatHip({ torso: 0, ...UPRIGHT_SEAT, uArm: 160, fArm: 10 }),
    to: seatHip({ torso: 0, ...UPRIGHT_SEAT, uArm: 8, fArm: 4 })
  },
  ohp_machine: {
    view: 'side', props: [FLOOR, { k: 'line', from: [74, 60], to: [80, 133], w: 7 }, benchSeat, benchLeg, { k: 'pad', at: 'wrist', r: 5 }],
    from: seatHip({ torso: 0, ...UPRIGHT_SEAT, uArm: 160, fArm: 10 }),
    to: seatHip({ torso: 0, ...UPRIGHT_SEAT, uArm: 8, fArm: 4 })
  },
  ohp_bar: { view: 'side', props: [FLOOR, { k: 'barbell', at: 'wrist', size: 13 }], from: stand({ uArm: 160, fArm: 10 }), to: stand({ uArm: 6, fArm: 3 }) },
  ohp_band: { view: 'side', props: [FLOOR, { k: 'band', at: 'wrist', to: [100, 188] }], from: stand({ uArm: 160, fArm: 10 }), to: stand({ uArm: 6, fArm: 3 }) },
  pike: {
    view: 'side', props: [FLOOR],
    from: { a: { torso: 140, neck: 150, thigh: 222, shin: 222, foot: 120, uArm: 150, fArm: 150 }, anchor: 'toe', at: [38, 189] },
    to: { a: { torso: 160, neck: 165, thigh: 225, shin: 225, foot: 120, uArm: 85, fArm: 175 }, anchor: 'toe', at: [38, 189] }
  },
  lateral: { view: 'front', props: ['floor', 'dumbbells'], from: { uArm: 172, fArm: 172 }, to: { uArm: 92, fArm: 95 } },
  lateral_cable: { view: 'front', props: ['floor', 'cables'], from: { uArm: 172, fArm: 172 }, to: { uArm: 92, fArm: 95 } },
  lateral_band: { view: 'front', props: ['floor', 'bands'], from: { uArm: 172, fArm: 172 }, to: { uArm: 92, fArm: 95 } },

  // ─── Puxar ───
  pulldown: {
    view: 'side', props: [FLOOR, benchSeat, benchLeg, { k: 'pad', at: 'knee', r: 6 }, { k: 'cable', at: 'wrist', to: [104, 8] }],
    from: seatHip({ torso: -12, neck: -5, ...UPRIGHT_SEAT, uArm: 8, fArm: 5 }),
    to: seatHip({ torso: -16, neck: -5, ...UPRIGHT_SEAT, uArm: 195, fArm: 20 })
  },
  pullup: {
    view: 'side', props: [{ k: 'line', from: [70, 16], to: [170, 16], w: 5 }],
    from: { a: { torso: 0, neck: 0, uArm: 5, fArm: 3, thigh: 185, shin: 205 }, anchor: 'wrist', at: [120, 16] },
    to: { a: { torso: -8, neck: 0, uArm: 195, fArm: 15, thigh: 175, shin: 205 }, anchor: 'wrist', at: [120, 16] }
  },
  band_pulldown: {
    view: 'side', props: [FLOOR, { k: 'band', at: 'wrist', to: [116, 6] }],
    from: { a: { torso: -5, thigh: 180, shin: 270, foot: 180, uArm: 10, fArm: 5 }, anchor: 'knee', at: [100, 186] },
    to: { a: { torso: -8, thigh: 180, shin: 270, foot: 180, uArm: 195, fArm: 20 }, anchor: 'knee', at: [100, 186] }
  },
  straight_pulldown: {
    view: 'side', props: [FLOOR, { k: 'cable', at: 'wrist', to: [176, 14] }],
    from: stand({ torso: 22, neck: 22, uArm: 40, fArm: 40, shin: 190, thigh: 172 }),
    to: stand({ torso: 22, neck: 22, uArm: 165, fArm: 165, shin: 190, thigh: 172 })
  },
  seated_row: {
    view: 'side', props: [FLOOR, { k: 'box', x: 40, y: 168, w: 70, h: 8 }, { k: 'box', x: 156, y: 140, w: 8, h: 50 }, { k: 'cable', at: 'wrist', to: [160, 150] }],
    from: seatHip({ torso: 18, neck: 18, thigh: 82, shin: 100, foot: 0, uArm: 92, fArm: 92 }, [72, 162]),
    to: seatHip({ torso: -6, neck: 0, thigh: 82, shin: 100, foot: 0, uArm: 215, fArm: 92 }, [72, 162])
  },
  band_row: {
    view: 'side', props: [FLOOR, { k: 'band', at: 'wrist', to: [160, 182] }],
    from: seatHip({ torso: 8, neck: 10, thigh: 88, shin: 92, foot: 0, uArm: 100, fArm: 98 }, [72, 182]),
    to: seatHip({ torso: -4, neck: 0, thigh: 88, shin: 92, foot: 0, uArm: 215, fArm: 92 }, [72, 182])
  },
  machine_row: {
    view: 'side', props: [FLOOR, benchSeat, benchLeg, { k: 'line', from: [130, 70], to: [130, 140], w: 7 }, { k: 'pad', at: 'wrist', r: 5 }],
    from: seatHip({ torso: 8, ...UPRIGHT_SEAT, uArm: 92, fArm: 92 }, [84, 128]),
    to: seatHip({ torso: 8, ...UPRIGHT_SEAT, uArm: 220, fArm: 95 }, [84, 128])
  },
  bent_row: { view: 'side', props: [FLOOR, { k: 'barbell', at: 'wrist', size: 13 }], from: stand({ shin: 195, thigh: 160, torso: 68, neck: 62, ...hang }), to: stand({ shin: 195, thigh: 160, torso: 68, neck: 62, uArm: 250, fArm: 175 }) },
  db_row: {
    view: 'side', props: [FLOOR, { k: 'box', x: 112, y: 120, w: 70, h: 9 }, { k: 'line', from: [170, 129], to: [170, 190], w: 5 }, { k: 'dumbbell', at: 'wrist' }],
    from: stand({ shin: 185, thigh: 172, torso: 82, neck: 78, uArm: 180, fArm: 180, uArm2: 180, fArm2: 180 }, 70),
    to: stand({ shin: 185, thigh: 172, torso: 82, neck: 78, uArm: 265, fArm: 180, uArm2: 180, fArm2: 180 }, 70)
  },
  inverted_row: {
    view: 'side', props: [FLOOR, { k: 'line', from: [120, 98], to: [190, 98], w: 5 }],
    from: { a: { torso: 72, neck: 72, thigh: 252, shin: 252, foot: 160, uArm: 50, fArm: 50 }, anchor: 'ankle', at: [28, 186] },
    to: { a: { torso: 58, neck: 58, thigh: 238, shin: 238, foot: 150, uArm: 205, fArm: 40 }, anchor: 'ankle', at: [28, 186] }
  },
  rear_fly: { view: 'side', props: [FLOOR, { k: 'dumbbell', at: 'wrist' }], from: stand({ shin: 192, thigh: 165, torso: 72, neck: 68, uArm: 175, fArm: 175 }), to: stand({ shin: 192, thigh: 165, torso: 72, neck: 68, uArm: 262, fArm: 258 }) },
  rear_fly_machine: { view: 'front', props: ['floor'], from: { uArm: 160, fArm: 200 }, to: { uArm: 90, fArm: 92 } },
  face_pull: { view: 'side', props: [FLOOR, { k: 'cable', at: 'wrist', to: [178, 58] }], from: stand({ uArm: 88, fArm: 85 }), to: stand({ uArm: 268, fArm: 25 }) },

  // ─── Braços ───
  curl_bar: { view: 'side', props: [FLOOR, { k: 'barbell', at: 'wrist', size: 12 }], from: stand({ ...hang }), to: stand({ uArm: 172, fArm: 28 }) },
  curl_db: { view: 'side', props: [FLOOR, { k: 'dumbbell', at: 'wrist' }], from: stand({ ...hang }), to: stand({ uArm: 172, fArm: 28 }) },
  curl_cable: { view: 'side', props: [FLOOR, { k: 'cable', at: 'wrist', to: [150, 186] }], from: stand({ ...hang }), to: stand({ uArm: 172, fArm: 28 }) },
  curl_band: { view: 'side', props: [FLOOR, { k: 'band', at: 'wrist', to: [100, 188] }], from: stand({ ...hang }), to: stand({ uArm: 172, fArm: 28 }) },
  preacher: {
    view: 'side', props: [FLOOR, benchSeat, benchLeg, { k: 'line', from: [96, 104], to: [126, 128], w: 7 }],
    from: seatHip({ torso: 8, ...UPRIGHT_SEAT, uArm: 140, fArm: 128 }, [80, 128]),
    to: seatHip({ torso: 8, ...UPRIGHT_SEAT, uArm: 140, fArm: 15 }, [80, 128])
  },
  pushdown: { view: 'side', props: [FLOOR, { k: 'cable', at: 'wrist', to: [130, 8] }], from: stand({ torso: 10, neck: 10, uArm: 178, fArm: 70 }), to: stand({ torso: 10, neck: 10, uArm: 178, fArm: 175 }) },
  pushdown_band: { view: 'side', props: [FLOOR, { k: 'band', at: 'wrist', to: [130, 8] }], from: stand({ torso: 10, neck: 10, uArm: 178, fArm: 70 }), to: stand({ torso: 10, neck: 10, uArm: 178, fArm: 175 }) },
  overhead_ext: { view: 'side', props: [FLOOR, { k: 'dumbbell', at: 'wrist' }], from: stand({ uArm: 8, fArm: 205 }), to: stand({ uArm: 8, fArm: 6 }) },
  skull: { view: 'side', props: [FLOOR, ...flatBench, { k: 'barbell', at: 'wrist', size: 11 }], from: lie({ torso: 270, neck: 275, ...LYING_LEGS, uArm: 350, fArm: 255 }), to: lie({ torso: 270, neck: 275, ...LYING_LEGS, uArm: 350, fArm: 355 }) },

  // ─── Core ───
  plank: {
    view: 'side', props: [FLOOR], hold: true,
    from: { a: { torso: 82, neck: 84, thigh: 262, shin: 262, foot: 172, uArm: 180, fArm: 90 }, anchor: 'toe', at: [30, 189] },
    to: { a: { torso: 84, neck: 86, thigh: 264, shin: 264, foot: 172, uArm: 180, fArm: 90 }, anchor: 'toe', at: [30, 189] }
  },
  side_plank: {
    view: 'side', props: [FLOOR], hold: true,
    from: { a: { torso: 68, neck: 70, thigh: 248, shin: 248, foot: 160, uArm: 180, fArm: 90, uArm2: 120, fArm2: 120 }, anchor: 'toe', at: [26, 189] },
    to: { a: { torso: 70, neck: 72, thigh: 250, shin: 250, foot: 160, uArm: 180, fArm: 90, uArm2: 120, fArm2: 120 }, anchor: 'toe', at: [26, 189] }
  },
  dead_bug: {
    view: 'side', props: [FLOOR],
    from: lie({ torso: 270, neck: 270, thigh: 15, shin: 100, thigh2: 15, shin2: 100, uArm: 0, fArm: 0, uArm2: 0, fArm2: 0 }, [112, 184]),
    to: lie({ torso: 270, neck: 270, thigh: 15, shin: 100, thigh2: 85, shin2: 88, uArm: 280, fArm: 275, uArm2: 0, fArm2: 0 }, [112, 184])
  },
  bird_dog: {
    view: 'side', props: [FLOOR],
    from: { a: { torso: 90, neck: 100, thigh: 180, shin: 270, foot: 200, thigh2: 180, shin2: 270, foot2: 200, uArm: 180, fArm: 180, uArm2: 180, fArm2: 180 }, anchor: 'knee', at: [70, 186] },
    to: { a: { torso: 90, neck: 98, thigh: 180, shin: 270, foot: 200, thigh2: 272, shin2: 272, foot2: 250, uArm: 180, fArm: 180, uArm2: 88, fArm2: 88 }, anchor: 'knee', at: [70, 186] }
  },
  pallof: { view: 'side', props: [FLOOR, { k: 'cable', at: 'wrist', to: [10, 92] }], from: stand({ uArm: 160, fArm: 85 }), to: stand({ uArm: 92, fArm: 92 }) },
  pallof_band: { view: 'side', props: [FLOOR, { k: 'band', at: 'wrist', to: [10, 92] }], from: stand({ uArm: 160, fArm: 85 }), to: stand({ uArm: 92, fArm: 92 }) },
  crunch: {
    view: 'side', props: [FLOOR],
    from: lie({ torso: 270, neck: 270, thigh: 35, shin: 150, uArm: 320, fArm: 160 }, [112, 184]),
    to: lie({ torso: 300, neck: 320, thigh: 35, shin: 150, uArm: 350, fArm: 190 }, [112, 184])
  },
  leg_raise: {
    view: 'side', props: [FLOOR],
    from: lie({ torso: 270, neck: 270, thigh: 92, shin: 92, foot: 10, uArm: 100, fArm: 100 }, [100, 184]),
    to: lie({ torso: 270, neck: 270, thigh: 10, shin: 10, foot: 100, uArm: 100, fArm: 100 }, [100, 184])
  },
  cable_crunch: {
    view: 'side', props: [FLOOR, { k: 'cable', at: 'wrist', to: [150, 8] }],
    from: { a: { torso: 15, neck: 25, thigh: 180, shin: 270, foot: 180, uArm: 120, fArm: 20 }, anchor: 'knee', at: [96, 186] },
    to: { a: { torso: 100, neck: 140, thigh: 172, shin: 270, foot: 180, uArm: 160, fArm: 60 }, anchor: 'knee', at: [96, 186] }
  }
} satisfies Record<string, Anim>;

export type AnimKey = keyof typeof ANIMS;

export const EXERCISE_ANIM: Record<string, AnimKey> = {
  supino_reto_barra: 'bench_bar',
  supino_reto_halteres: 'bench_db',
  supino_inclinado_halteres: 'incline_db',
  supino_inclinado_barra: 'incline_bar',
  supino_maquina: 'chest_press',
  flexao_bracos: 'pushup',
  flexao_inclinada: 'pushup_incline',
  crucifixo_halteres: 'fly_db',
  crucifixo_maquina: 'fly_front',
  crossover_polia: 'crossover',
  mergulho_paralelas: 'dips',
  puxada_frente: 'pulldown',
  barra_fixa: 'pullup',
  barra_fixa_supinada: 'pullup',
  puxada_elastico: 'band_pulldown',
  pulldown_bracos_estendidos: 'straight_pulldown',
  remada_baixa_polia: 'seated_row',
  remada_curvada_barra: 'bent_row',
  remada_unilateral_halter: 'db_row',
  remada_maquina: 'machine_row',
  remada_elastico: 'band_row',
  remada_invertida: 'inverted_row',
  desenvolvimento_halteres: 'ohp_seated',
  desenvolvimento_barra: 'ohp_bar',
  desenvolvimento_maquina: 'ohp_machine',
  desenvolvimento_elastico: 'ohp_band',
  pike_pushup: 'pike',
  elevacao_lateral_halteres: 'lateral',
  elevacao_lateral_polia: 'lateral_cable',
  elevacao_lateral_elastico: 'lateral_band',
  crucifixo_inverso_halteres: 'rear_fly',
  face_pull: 'face_pull',
  crucifixo_inverso_maquina: 'rear_fly_machine',
  agachamento_goblet: 'squat_goblet',
  agachamento_livre: 'squat_bar',
  agachamento_smith: 'squat_smith',
  leg_press: 'leg_press',
  agachamento_hack: 'hack',
  agachamento_peso_corporal: 'squat_bw',
  cadeira_extensora: 'leg_ext',
  afundo_halteres: 'lunge',
  afundo_peso_corporal: 'lunge_bw',
  agachamento_bulgaro: 'bulgarian',
  subida_banco: 'step_up',
  terra_romeno_barra: 'rdl',
  terra_romeno_halteres: 'rdl_db',
  terra_romeno_unilateral: 'rdl_single',
  levantamento_terra: 'deadlift',
  kettlebell_swing: 'swing',
  mesa_flexora: 'leg_curl_lying',
  cadeira_flexora: 'leg_curl_seated',
  flexao_nordica: 'nordic',
  elevacao_pelvica_barra: 'hip_thrust',
  elevacao_pelvica_halter: 'hip_thrust',
  ponte_gluteo: 'glute_bridge',
  ponte_unilateral: 'glute_bridge_single',
  coice_polia: 'kickback',
  panturrilha_em_pe_maquina: 'calf',
  panturrilha_sentado: 'calf_seated',
  panturrilha_leg_press: 'calf_press',
  panturrilha_halter: 'calf_db',
  panturrilha_peso_corporal: 'calf',
  rosca_direta_barra: 'curl_bar',
  rosca_alternada: 'curl_db',
  rosca_martelo: 'curl_db',
  rosca_polia: 'curl_cable',
  rosca_scott_maquina: 'preacher',
  rosca_elastico: 'curl_band',
  triceps_polia: 'pushdown',
  triceps_frances_halter: 'overhead_ext',
  triceps_testa: 'skull',
  mergulho_banco: 'bench_dips',
  triceps_elastico: 'pushdown_band',
  flexao_fechada: 'pushup_close',
  prancha: 'plank',
  prancha_lateral: 'side_plank',
  dead_bug: 'dead_bug',
  perdigueiro: 'bird_dog',
  pallof_polia: 'pallof',
  pallof_elastico: 'pallof_band',
  abdominal_supra: 'crunch',
  elevacao_pernas: 'leg_raise',
  abdominal_polia: 'cable_crunch'
};

/** Animação para exercícios personalizados: escolhe pela categoria de movimento. */
export const PATTERN_FALLBACK: Record<string, AnimKey> = {
  agachamento: 'squat_bw', dobradica: 'rdl_db', unilateral_pernas: 'lunge_bw', extensao_quadril: 'glute_bridge',
  flexao_joelho: 'leg_curl_seated', extensao_joelho: 'leg_ext', panturrilha: 'calf', empurrar_horizontal: 'pushup',
  empurrar_vertical: 'ohp_seated', puxar_horizontal: 'seated_row', puxar_vertical: 'pulldown', crucifixo: 'fly_front',
  elevacao_lateral: 'lateral', deltoide_posterior: 'rear_fly', flexao_cotovelo: 'curl_db', extensao_cotovelo: 'pushdown',
  core_antiextensao: 'plank', core_flexao: 'crunch', core_antirrotacao: 'pallof'
};

export function animFor(exerciseId: string, pattern: string): Anim {
  return ANIMS[EXERCISE_ANIM[exerciseId] ?? PATTERN_FALLBACK[pattern] ?? 'squat_bw'] as Anim;
}
