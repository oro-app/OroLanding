export const ENGINEERING_NOTES = [
  {
    path: '/research/context-before-composition',
    status: 'published',
    publicationDate: '2026-10-04T03:07:13.000Z',
    title: 'Context Before Composition | Oro Engineering Notes',
    description: 'How wardrobe, setting, comfort, and style intent shape useful outfit recommendations, and why conversation changes the styling problem.',
    h1: 'Context before composition',
    category: 'Engineering note',
    author: 'Oro',
    answer: [
      'An outfit recommendation is a decision about a particular person getting dressed for a particular situation. Clothes can be individually appealing and still fail together. They can also work together while being wrong for the day. Styling has to account for the relationships between garments, the person wearing them, and the setting.',
      'Oro works with a person’s wardrobe, styling context, and explicit preferences. We treat functionality, formality, and style intent as distinct dimensions of a styling request. In conversation, the brief can become more specific: a piece to build around, a comfort requirement, or a correction to an earlier suggestion. The task is to make a useful decision within the person’s actual circumstances.',
    ],
    sections: [
      {
        heading: 'The wardrobe defines the available answer',
        paragraphs: [
          'A recommendation must be expressible in pieces the person actually owns. Ownership is different from visual resemblance: a navy blazer in a reference image does not make a navy blazer available. Advice becomes incomplete when it quietly substitutes an imagined garment for a real one.',
          'Availability alone does not settle the choice. Garments in the same category can differ in structure, length, fabric, and ease of movement. Those differences affect how they combine. Descriptions and photos supply useful information, but they cannot establish every detail of fit or comfort. What the wearer says matters alongside what can be described visually.',
        ],
      },
      {
        heading: 'An occasion label leaves questions open',
        paragraphs: [
          '“Dinner” does not specify a dress code, a journey, or how someone wants to feel. Formality concerns the degree of polish appropriate to the setting. Functionality concerns what the outfit needs to allow: walking, sitting, carrying things, or moving between temperatures. These considerations can pull in different directions without being contradictory.',
          'Style intent adds another distinction. Someone may want to feel understated, expressive, relaxed, or more deliberate than usual. That intention should be considered within practical requirements. Weather, when supplied, can change the clothing choice; an occasion label alone cannot stand in for those conditions.',
        ],
      },
      {
        heading: 'Illustrative example',
        paragraphs: [
          'Consider an invented styling situation: a person wants to wear familiar trousers and a knit to dinner. They have both loafers and comfortable trainers available. The restaurant permits either, but the evening includes a long walk. There is no universally correct shoe choice independent of that information.',
          'If the person wants a polished finish, the question becomes how to achieve it while respecting the walk. A well-kept trainer and a more structured layer may serve that brief. If they prefer the loafers and know they can walk comfortably in them, that is relevant information too.',
        ],
      },
      {
        heading: 'How conversation changes the problem',
        paragraphs: [
          'Developing styling over text brings the interpretation of a request into focus. “Something smarter” could mean a sharper silhouette, a quieter colour combination, or different footwear. A useful refinement preserves what already fits the brief and identifies which part needs to change. Replacing the whole outfit can obscure the original objection.',
          'Published work on outfit generation distinguishes compatibility from personalization. Practical styling adds the question of suitability for this particular day. A coherent outfit must also be available, suitable for the moment, and relevant to the wearer. Missing garment information, unclear expectations, and comfort that only the wearer can judge belong in the conversation.',
        ],
      },
    ],
    related: ['/research/evaluating-personal-style', '/research/learning-from-specific-feedback'],
    sources: [
      {
        title: 'Personalized Outfit Generation for Fashion Recommendation (2019)',
        url: 'https://arxiv.org/abs/1905.01866',
      },
    ],
  },
  {
    path: '/research/evaluating-personal-style',
    status: 'published',
    publicationDate: '2026-10-04T03:07:13.000Z',
    title: 'Evaluating Personal Style | Oro Engineering Notes',
    description: 'A precise way to frame outfit quality, separate practical constraints from taste, and interpret the limits of engagement and wear signals.',
    h1: 'Evaluating personal style',
    category: 'Engineering note',
    author: 'Oro',
    answer: [
      'Personal styling allows several reasonable answers to the same request. An outfit can be coherent without suiting its wearer, and familiar without being suitable for the occasion. Evaluating a recommendation therefore requires more than deciding whether the clothes look good together. It requires a clear account of the brief and what the answer is supposed to accomplish.',
      'For Oro, useful evaluation criteria include wardrobe accuracy, practical suitability, coherence, responsiveness to stated preferences, and the quality of a revision. Some criteria can be checked against the wardrobe and the brief; others require the wearer’s judgment. Keeping them separate makes failures easier to diagnose.',
    ],
    sections: [
      {
        heading: 'Several questions inside “good”',
        bullets: [
          'Wardrobe accuracy: are the proposed clothes actually available to the person?',
          'Practical suitability: does the outfit respect the stated setting, movement, weather, and comfort requirements?',
          'Coherence: do proportions, colour, texture, and layers work together as a complete outfit?',
          'Personal relevance: does the suggestion respond to the person’s expressed direction rather than assume a universal taste?',
          'Revision quality: does a changed recommendation address the objection while preserving the other requirements?',
        ],
        paragraphs: [
          'These questions should remain distinguishable. An unavailable garment is a concrete error. A difference in aesthetic preference calls for interpretation. Combining both into one favourable overall impression can conceal the reason an outfit would fail in practice.',
        ],
      },
      {
        heading: 'Outcome signals answer different questions',
        paragraphs: [
          'When such information is available, opening or saving an outfit can indicate interest. It does not establish that the person tried it on or wore it. A saved look may be aspirational, useful for another season, or simply worth considering. Treating attention as confirmed suitability gives the signal more meaning than it contains.',
          'Actual wear is closer to the decision the recommendation supports, but it also needs context. A person might wear an outfit because it was ready, appropriate to an obligation, or the most practical available option. Repeating it can reflect preference, convenience, or limited alternatives. Feedback about comfort and the setting can help distinguish those explanations.',
        ],
      },
      {
        heading: 'Judgment needs the original brief',
        paragraphs: [
          'A reviewer who sees only the clothes can assess some aspects of coherence. They cannot reliably assess a walking requirement, an unwanted fabric, or the wearer’s intended level of formality if that information is absent. A useful review should evaluate the recommendation against the information available when the choice was made.',
          'Independent work on outfit quality has used expert criteria alongside indirect customer metrics. That separation is useful: a stylist’s judgment and a person’s response answer related questions, but neither automatically substitutes for the other. Disagreement should prompt examination of the criterion, the context, and the explanation before it is reduced to a single score.',
        ],
      },
      {
        heading: 'Illustrative example',
        paragraphs: [
          'In an invented example, a tailored jacket and polished shoes receive a favourable aesthetic review. The request, however, specifies a relaxed afternoon with considerable walking, and the wearer has rejected the shoes as uncomfortable. The outfit can look coherent while failing the actual brief.',
          'A revised combination might meet the walking requirement while feeling too casual to the person. The next evaluation question is then specific: did the revision preserve the desired polish? Coherence, practical suitability, and personal relevance can move in different directions. The reasons behind each judgment need to remain visible.',
        ],
      },
    ],
    related: ['/research/context-before-composition', '/research/learning-from-specific-feedback'],
    sources: [
      {
        title: 'Experts in-the-Loop: outfit quality evaluation (2022)',
        url: 'https://multithreaded.stitchfix.com/blog/2022/09/02/stylists-in-the-loop/',
      },
    ],
  },
  {
    path: '/research/learning-from-specific-feedback',
    status: 'published',
    publicationDate: '2026-10-04T03:07:13.000Z',
    title: 'Learning from Specific Feedback | Oro Engineering Notes',
    description: 'Why an outfit reaction needs its original context, how a useful revision addresses the cause, and where a preference inference should stop.',
    h1: 'Learning from specific feedback',
    category: 'Engineering note',
    author: 'Oro',
    answer: [
      '“I don’t like it” contains an objection, but not necessarily its cause. The issue might be a particular garment, the combination, the level of formality, or the situation the outfit was meant to serve. Interpreting the reaction requires keeping the proposed look and the original request in view.',
      'Oro can use a reaction to a previous recommendation when a person asks for a revision. The preceding outfit gives the feedback a concrete reference. The engineering question is how to make that correction useful without turning a local objection into a broad assumption about the person’s taste.',
    ],
    sections: [
      {
        heading: 'Locate the objection',
        paragraphs: [
          '“Too formal” describes the overall impression. It does not establish that the wearer dislikes every tailored piece. Formality can come from a combination of structure, fabric, footwear, and styling. A jacket that feels wrong with polished shoes may work with a softer layer and a familiar trainer.',
          'More specific feedback narrows the interpretation. “Keep the trousers, but the shoes feel too dressy” identifies both a preference to preserve and a cause to examine. “Those shoes hurt when I walk” supplies a practical constraint. The same rejected item can therefore carry different implications depending on the reason given.',
        ],
      },
      {
        heading: 'A useful revision changes the cause',
        paragraphs: [
          'A recommendation can change substantially without responding to the objection. Swapping colours will not resolve uncomfortable footwear. Replacing every garment after a request to soften one detail may discard the parts that already worked. Novelty and responsiveness are different qualities.',
          'The revision should be assessed against both the correction and the remaining brief. If the person wants less formality for a workday, the new outfit still needs to respect the workplace. If they ask to retain a favourite piece, that request remains relevant while other elements change. The purpose of an edit is clearer when those requirements stay visible.',
        ],
      },
      {
        heading: 'Illustrative example',
        paragraphs: [
          'Imagine an invented exchange about a dinner outfit: “I like the shirt and trousers. The boots make it feel too heavy.” A useful interpretation starts with the impression created by the boots in this combination. It does not immediately conclude that the person dislikes boots as a category.',
          'Trying a lighter-looking shoe may address the visual balance, provided it also suits the journey and setting. If the person then says the concern was weight and comfort rather than appearance, the interpretation needs another adjustment. The distinction between visual weight and physical discomfort changes what a useful revision looks like.',
        ],
      },
      {
        heading: 'Preference has a scope',
        paragraphs: [
          'A rejection for one occasion may leave the same garment appropriate elsewhere. “I don’t want a jacket tonight” and “I never feel comfortable in this jacket” describe different scopes. Treating them as equivalent can unnecessarily narrow future choices or repeatedly revisit something the wearer has clearly ruled out.',
          'A recorded reaction still needs interpretation when it becomes relevant again. The context can change, and a person can change their mind. Repeated, consistent feedback may support a broader understanding, but that understanding should remain proportional to what was actually said. Silence is missing information, rather than confirmation that a recommendation worked.',
          'Here, learning from feedback means using explicit information to refine a styling decision. A meaningful revision addresses the stated objection, preserves useful parts of the brief, and leaves room for another correction. Preferences and circumstances can change; a useful recommendation stays responsive to the person making the decision.',
        ],
      },
    ],
    related: ['/research/context-before-composition', '/research/evaluating-personal-style'],
  },
];
