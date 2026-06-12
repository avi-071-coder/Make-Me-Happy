// Hardcoded fallback comfort messages by mood (used when all AI APIs fail)
const moodsPool = {
  Happy: {
    greetings: [
      "Your joy lights up the whole forest, dear friend!",
      "Barnaby is doing a happy dance because you're happy!",
      "The lanterns in the Great Tree glow brighter when you smile!",
      "What a wonderful thing — your happiness makes the whole sanctuary bloom!",
      "Barnaby's bamboo tastes extra sweet today because of your good mood!"
    ],
    messages: [
      "Keep riding this wave — you deserve every bit of this joy.",
      "Your happiness is contagious. Even the fireflies are dancing!",
      "Remember this feeling — bottle it up as a memory firefly for tough days.",
      "Celebrate yourself today. You've earned this lightness.",
      "Share your smile with someone who needs it. Joy multiplies when shared.",
      "Take a moment to notice what made you happy — those details matter.",
      "Dance like nobody's watching (Barnaby certainly dances that way)!",
      "Your positive energy is a gift to everyone around you.",
      "Write down three things that brought you here. Gratitude anchors happiness.",
      "Let this feeling fill every corner of your heart. You are radiant.",
      "This is proof that beautiful moments exist, even in hard seasons.",
      "Laugh out loud today — your future self will thank you.",
      "Your happiness isn't selfish — it's necessary and beautiful.",
      "Barnaby wants you to know: seeing you happy is his favorite thing.",
      "The world needs your light. Never dim it for anyone."
    ]
  },
  Sad: {
    greetings: [
      "Oh, sweet friend... Barnaby is wrapping you in the softest bamboo blanket right now.",
      "It's okay to feel this way. Barnaby is sitting right beside you, quietly.",
      "The rain waters the garden too, dear one. Your feelings matter.",
      "Barnaby's ears droop when you're sad — because he feels it with you.",
      "Come sit under the Great Tree. There's always room for you here."
    ],
    messages: [
      "It's okay to not be okay. You don't need to perform happiness.",
      "Sadness isn't weakness — it means your heart can feel deeply.",
      "Cry if you need to. Tears water the seeds of healing.",
      "You don't have to carry this alone. Barnaby is here.",
      "This storm will pass. You've weathered storms before, brave one.",
      "Be gentle with yourself today — you're doing harder things than most people see.",
      "Sometimes the bravest thing is just making it through the day.",
      "Wrap yourself in something cozy. You deserve comfort right now.",
      "Your sadness is temporary, but your strength is permanent.",
      "Even on your worst days, you are worthy of love and kindness.",
      "It's okay to cancel plans and just exist today. That's enough.",
      "Put your hand on your heart — feel it beating? That's resilience.",
      "The fact that you showed up here means you're still fighting. That's heroic.",
      "Barnaby is making you imaginary hot chocolate with extra marshmallows.",
      "Tomorrow is a blank page. Tonight, just rest."
    ]
  },
  Anxious: {
    greetings: [
      "Take a breath with Barnaby — he's breathing slowly right beside you.",
      "Your worries are valid, but they don't define you. You're safe here.",
      "The sanctuary walls keep the scary things out. You're protected here.",
      "Barnaby knows that racing feeling. Let's slow down together.",
      "Ground yourself, dear friend. Feel your feet. You are HERE and you are safe."
    ],
    messages: [
      "Name 5 things you can see right now. You're grounding yourself — good.",
      "Anxiety lies to you. You ARE capable. You WILL be okay.",
      "Try the Breathing Bubble — four seconds in, four out. Barnaby's doing it with you.",
      "Your brain is trying to protect you. Thank it, then tell it to rest.",
      "The worst-case scenario almost never happens. You've got this.",
      "Unclench your jaw. Drop your shoulders. Release your fists. Breathe.",
      "You don't need to solve everything right now. Just this moment.",
      "Put one hand on your chest. Breathe. Your heartbeat is a lullaby.",
      "Worry is a rocking chair — it moves but goes nowhere. Step off gently.",
      "The future isn't here yet. All you have is now, and now is manageable.",
      "Barnaby wants to remind you: you've survived 100% of your anxious days.",
      "Drink some cold water. Splash some on your face. Reset.",
      "Write down what's worrying you in the Let It Go box. Release it.",
      "You are not your thoughts. You are the one observing them.",
      "This feeling is a wave. Let it crest and fall. You'll still be standing."
    ]
  },
  Tired: {
    greetings: [
      "Oh, sleepy friend... Barnaby saved you the comfiest spot under the tree.",
      "Your tiredness is your body asking for love. Listen to it.",
      "Even pandas nap 10 hours a day. There's no shame in resting.",
      "The forest is quiet tonight. It's resting too. Join it.",
      "Barnaby yawns with you. *Yaaaaaawn* ... see? Contagious."
    ],
    messages: [
      "Rest isn't a reward — it's a requirement. You've earned it.",
      "Close your eyes for just two minutes. Barnaby will keep watch.",
      "You've been carrying so much. It's okay to set it down for a while.",
      "Your bed is calling you. Go answer. The world can wait.",
      "Tiredness means you've been giving your all. That takes courage.",
      "Drink some water. Dehydration makes everything feel heavier.",
      "Give yourself permission to do absolutely nothing. That IS productive.",
      "Cancel one thing tomorrow. You'll feel lighter immediately.",
      "Listen to rain sounds or forest ambience. Let nature carry you to rest.",
      "You don't have to earn rest by being productive first. Just rest.",
      "Barnaby's prescription: Cozy blanket, warm drink, zero responsibilities.",
      "Your energy will come back. Right now, recharging IS the job.",
      "Even the sun sets every day. You're allowed to, as well.",
      "Stretch gently. Your body has been working so hard for you.",
      "Tomorrow-you will thank today-you for resting. Trust that."
    ]
  },
  Okay: {
    greetings: [
      "Just okay is perfectly fine. Barnaby is happy you're here!",
      "Neutral days are the bridge between the hard and the good. You're on your way!",
      "Not every day needs to be amazing. 'Okay' is a victory too.",
      "Barnaby nods knowingly. Sometimes 'okay' is honestly the best answer.",
      "The forest is calm today — just like you. And that's beautiful."
    ],
    messages: [
      "'Okay' is underrated. It means you're here, you're present, you're alive.",
      "On okay days, tiny joys hit different. Look for one today.",
      "You don't need to force excitement. Steady and peaceful is powerful.",
      "An okay day is a day without crisis. That's actually wonderful.",
      "Maybe today is the calm before something beautiful. Stay open.",
      "Use this neutral energy to do one small thing that future-you will love.",
      "Pet an animal, real or imaginary. Barnaby recommends it.",
      "Try humming your favorite song. It shifts the energy gently.",
      "Write one sentence about what you're grateful for. Just one.",
      "Okay days are the ones that add up into a good life.",
      "Look outside. Really look. Notice something you usually miss.",
      "Barnaby says: okay days are perfect for bamboo snacks and naps.",
      "Send a message to someone you haven't talked to in a while.",
      "Do one tiny win from your list. Momentum builds from stillness.",
      "You're here. That's more than enough. That's everything."
    ]
  },
  Angry: {
    greetings: [
      "Barnaby sees your fire. It's okay — let's channel it together.",
      "Your anger is valid. Something matters to you deeply, and that's human.",
      "Even bamboo cracks under pressure sometimes. It's natural.",
      "Barnaby isn't scared of your anger. He sits with you through all of it.",
      "The volcano inside you is trying to protect something precious."
    ],
    messages: [
      "Feel the anger, but don't let it drive. You are the driver.",
      "Punch a pillow. Scream into a blanket. Let the energy OUT safely.",
      "Write down exactly what made you angry in the Let It Go box. Then shred it.",
      "Your anger means your boundaries matter. That's healthy.",
      "Take 10 deep breaths before you speak or act. You'll thank yourself.",
      "Go for a walk — even a short one. Movement metabolizes anger.",
      "You're allowed to be angry without being destructive. That's strength.",
      "Ask yourself: will this matter in 5 years? If not, exhale and let go.",
      "Channel this fire into something creative. Angry art is powerful art.",
      "Barnaby wants you to know: being angry doesn't make you a bad person.",
      "Splash cold water on your face. It literally resets your nervous system.",
      "Name the hurt underneath the anger. That's where the healing is.",
      "You don't have to resolve this right now. Stepping away IS action.",
      "The strongest people know when to walk away. Be the strongest.",
      "This too shall pass. And you'll still be standing, wiser and calmer."
    ]
  }
};

module.exports = moodsPool;
