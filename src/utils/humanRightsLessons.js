// utils/humanRightsLessons.js

// Data for human rights lessons
export const humanRightsLessons = [
  {
    id: 1,
    titleKey: "lessons.right_to_life.title",
    contentKey: "lessons.right_to_life.content",
  },
  {
    id: 2,
    titleKey: "lessons.freedom_of_thought_speech.title",
    contentKey: "lessons.freedom_of_thought_speech.content",
  },
  {
    id: 3,
    titleKey: "lessons.freedom_of_action.title",
    contentKey: "lessons.freedom_of_action.content",
  },
  {
    id: 4,
    titleKey: "lessons.right_to_property.title",
    contentKey: "lessons.right_to_property.content",
  },
  {
    id: 5,
    titleKey: "lessons.right_to_weapons_for_defense.title",
    contentKey: "lessons.right_to_weapons_for_defense.content",
  },
  {
    id: 6,
    titleKey: "lessons.equality_before_law.title",
    contentKey: "lessons.equality_before_law.content",
  },
  {
    id: 7,
    titleKey: "lessons.right_to_appeal_translation_enforcement.title",
    contentKey: "lessons.right_to_appeal_translation_enforcement.content",
  },
  {
    id: 8,
    titleKey: "lessons.protection_from_judicial_errors.title",
    contentKey: "lessons.protection_from_judicial_errors.content",
  },
  {
    id: 9,
    titleKey: "lessons.protection_of_human_dignity.title",
    contentKey: "lessons.protection_of_human_dignity.content",
  },
  {
    id: 10,
    titleKey: "lessons.protection_of_children_right_to_refuse_parenting.title",
    contentKey:
      "lessons.protection_of_children_right_to_refuse_parenting.content",
  },
];

// Utility function to get lesson by ID
export const getLessonById = (id) => {
  return humanRightsLessons.find((lesson) => lesson.id === id);
};

// Utility function to get all lessons
export const getAllLessons = () => {
  return humanRightsLessons;
};
