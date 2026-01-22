// utils/humanRightsTests.js

// Data for human rights tests
export const humanRightsTests = [
  {
    id: 1,
    questionKey: "tests.which_is_highest_value",
    options: [
      { key: "answers.right_to_rest", value: "rest" },
      { key: "answers.right_to_work", value: "work" },
      { key: "answers.right_to_life", value: "life" },
      { key: "answers.right_to_reading", value: "reading" },
    ],
    correctAnswer: "life",
  },
  {
    id: 2,
    questionKey: "tests.right_to_life_includes",
    options: [
      { key: "answers.internet_education", value: "internet" },
      {
        key: "answers.food_water_air_warmth_sleep",
        value: "basic_needs",
      },
      {
        key: "answers.entertainment_shopping_friends",
        value: "entertainment",
      },
      { key: "answers.paying_utilities", value: "utilities" },
    ],
    correctAnswer: "basic_needs",
  },
  {
    id: 3,
    questionKey: "tests.can_person_defend_with_others",
    options: [
      { key: "answers.only_alone", value: "alone" },
      { key: "answers.only_with_permission", value: "permission" },
      { key: "answers.yes_collective_defense", value: "collective" },
      { key: "answers.forbidden_by_law", value: "forbidden" },
    ],
    correctAnswer: "collective",
  },
  {
    id: 4,
    questionKey: "tests.child_protection_until_age",
    options: [
      { key: "answers.until_14", value: "14" },
      { key: "answers.until_21", value: "21" },
      { key: "answers.until_18", value: "18" },
      { key: "answers.until_36", value: "36" },
    ],
    correctAnswer: "18",
  },
  {
    id: 5,
    questionKey: "tests.freedom_of_thought_protects_from",
    options: [
      { key: "answers.work_obligation", value: "work" },
      { key: "answers.paying_taxes", value: "taxes" },
      { key: "answers.specific_clothing", value: "clothing" },
      { key: "answers.forcing_beliefs_change", value: "forcing" },
    ],
    correctAnswer: "forcing",
  },
  {
    id: 6,
    questionKey: "tests.speech_limitation_allowed",
    options: [
      { key: "answers.ban_religious_views", value: "religious" },
      { key: "answers.when_violate_rights_of_others", value: "violate" },
      { key: "answers.ban_officials_criticism", value: "criticism" },
      { key: "answers.censorship_political_views", value: "censorship" },
    ],
    correctAnswer: "violate",
  },
  {
    id: 7,
    questionKey: "tests.choosing_residence_belongs_to",
    options: [
      { key: "answers.freedom_of_action", value: "action" },
      { key: "answers.right_to_medical_care", value: "medical" },
      { key: "answers.right_to_property", value: "property" },
      { key: "answers.right_to_fair_trial", value: "trial" },
    ],
    correctAnswer: "action",
  },
  {
    id: 8,
    questionKey: "tests.adult_right_to_refuse_parenting",
    options: [
      { key: "answers.yes_without_judgment", value: "yes" },
      { key: "answers.only_by_court_decision", value: "court" },
      { key: "answers.forbidden", value: "forbidden" },
      { key: "answers.only_if_no_children", value: "no_children" },
    ],
    correctAnswer: "yes",
  },
  {
    id: 9,
    questionKey: "tests.what_property_can_be_shared",
    options: [
      { key: "answers.only_non_material", value: "non_material" },
      { key: "answers.both_material_and_non_material", value: "both" },
      { key: "answers.none_can_be_shared", value: "none" },
      { key: "answers.only_material", value: "material" },
    ],
    correctAnswer: "both",
  },
  {
    id: 10,
    questionKey: "tests.what_is_servitude",
    options: [
      { key: "answers.compensation_for_damage", value: "compensation" },
      {
        key: "answers.limited_use_of_others_property",
        value: "limited_use",
      },
      {
        key: "answers.full_disposal_of_others_property",
        value: "full_disposal",
      },
      { key: "answers.right_to_inheritance", value: "inheritance" },
    ],
    correctAnswer: "limited_use",
  },
  {
    id: 11,
    questionKey: "tests.weapon_right_purpose",
    options: [
      {
        key: "answers.protect_life_health_property",
        value: "protection",
      },
      { key: "answers.business_activities", value: "business" },
      { key: "answers.status_demonstration", value: "status" },
      { key: "answers.hunting_sports", value: "hunting" },
    ],
    correctAnswer: "protection",
  },
  {
    id: 12,
    questionKey: "tests.is_weapon_right_unlimited",
    options: [
      { key: "answers.only_military_students", value: "military" },
      { key: "answers.completely_forbidden", value: "forbidden" },
      {
        key: "answers.only_for_defense_no_aggression",
        value: "defense_only",
      },
      { key: "answers.complete_freedom", value: "complete" },
    ],
    correctAnswer: "defense_only",
  },
  {
    id: 13,
    questionKey: "tests.equality_before_law_based_on",
    options: [
      {
        key: "answers.equality_regardless_of_gender_age_nationality",
        value: "absolute",
      },
      { key: "answers.depends_on_wealth", value: "wealth" },
      {
        key: "answers.preference_for_certain_groups",
        value: "preference",
      },
      {
        key: "answers.equality_only_in_criminal_cases",
        value: "criminal_only",
      },
    ],
    correctAnswer: "absolute",
  },
  {
    id: 14,
    questionKey: "tests.presumption_of_innocence_means",
    options: [
      { key: "answers.innocent_until_proven_guilty", value: "innocent" },
      { key: "answers.not_for_minors", value: "not_minors" },
      { key: "answers.guilty_until_proven_otherwise", value: "guilty" },
      { key: "answers.court_always_acquits", value: "acquits" },
    ],
    correctAnswer: "innocent",
  },
  {
    id: 15,
    questionKey: "tests.must_trial_be_public",
    options: [
      { key: "answers.always_closed", value: "closed" },
      { key: "answers.only_if_accused_wants", value: "accused" },
      { key: "answers.yes_for_societal_control", value: "public" },
      { key: "answers.only_in_criminal_cases", value: "criminal" },
    ],
    correctAnswer: "public",
  },
  {
    id: 16,
    questionKey: "tests.right_if_not_speak_court_language",
    options: [
      { key: "answers.automatic_acquittal", value: "acquittal" },
      { key: "answers.refuse_participation", value: "refuse" },
      {
        key: "answers.translation_native_language",
        value: "translation",
      },
      { key: "answers.change_judge", value: "change_judge" },
    ],
    correctAnswer: "translation",
  },
  {
    id: 17,
    questionKey: "tests.can_court_decision_be_appealed",
    options: [
      { key: "answers.yes_in_higher_instances", value: "yes" },
      { key: "answers.no_final_decision", value: "no" },
      { key: "answers.only_if_judge_agrees", value: "judge_agrees" },
      { key: "answers.within_24_hours", value: "24_hours" },
    ],
    correctAnswer: "yes",
  },
  {
    id: 18,
    questionKey: "tests.what_if_judicial_error_caused_harm",
    options: [
      { key: "answers.nothing", value: "nothing" },
      { key: "answers.judge_apology_only", value: "apology" },
      {
        key: "answers.moral_material_compensation",
        value: "compensation",
      },
      { key: "answers.review_no_compensation", value: "review" },
    ],
    correctAnswer: "compensation",
  },
  {
    id: 19,
    questionKey: "tests.person_right_to_be_informed_about",
    options: [
      {
        key: "answers.reasons_for_any_rights_restriction",
        value: "reasons",
      },
      { key: "answers.officials_professional_plans", value: "plans" },
      { key: "answers.unused_vacation_days", value: "vacation" },
      { key: "answers.judges_income", value: "income" },
    ],
    correctAnswer: "reasons",
  },
  {
    id: 20,
    questionKey: "tests.what_is_absolute_value",
    options: [
      { key: "answers.right_to_dreams", value: "dreams" },
      { key: "answers.human_dignity", value: "dignity" },
      { key: "answers.right_to_collect", value: "collect" },
      { key: "answers.right_to_rest", value: "rest" },
    ],
    correctAnswer: "dignity",
  },
  {
    id: 21,
    questionKey: "tests.is_medical_intervention_without_consent_allowed",
    options: [
      { key: "answers.only_for_minors", value: "minors" },
      { key: "answers.always_forbidden", value: "forbidden" },
      { key: "answers.only_in_emergency_cases", value: "emergency" },
      { key: "answers.yes_always", value: "always" },
    ],
    correctAnswer: "emergency",
  },
  {
    id: 22,
    questionKey: "tests.child_rights_under_special_protection",
    options: [
      {
        key: "answers.right_to_refuse_parenting",
        value: "refuse_parenting",
      },
      { key: "answers.right_to_weapons", value: "weapons" },
      {
        key: "answers.safety_development_education_care",
        value: "safety",
      },
      { key: "answers.right_to_watch_cartoons", value: "cartoons" },
    ],
    correctAnswer: "safety",
  },
  {
    id: 23,
    questionKey: "tests.does_policy_protect_psychological_integrity",
    options: [
      { key: "answers.no_only_physical", value: "no" },
      {
        key: "answers.yes_intimidation_blackmail_forbidden",
        value: "yes",
      },
      { key: "answers.only_for_pregnant", value: "pregnant" },
      { key: "answers.only_working_hours", value: "working" },
    ],
    correctAnswer: "yes",
  },
  {
    id: 24,
    questionKey: "tests.right_to_care_for_others_includes",
    options: [
      { key: "answers.no_one", value: "no_one" },
      { key: "answers.only_own_children", value: "own_children" },
      { key: "answers.only_officials", value: "officials" },
      { key: "answers.close_family_friends_strangers", value: "all" },
    ],
    correctAnswer: "all",
  },
  {
    id: 25,
    questionKey: "tests.right_to_refuse_parenting_applies_to",
    options: [
      { key: "answers.only_women", value: "women" },
      { key: "answers.adults_both_genders", value: "both_genders" },
      { key: "answers.only_over_40", value: "over_40" },
      { key: "answers.forbidden_for_all", value: "forbidden" },
    ],
    correctAnswer: "both_genders",
  },
  {
    id: 26,
    questionKey: "tests.right_to_income_from_property",
    options: [
      { key: "answers.only_from_inheritance", value: "inheritance" },
      { key: "answers.no", value: "no" },
      { key: "answers.yes", value: "yes" },
      { key: "answers.only_real_estate", value: "real_estate" },
    ],
    correctAnswer: "yes",
  },
  {
    id: 27,
    questionKey: "tests.what_guaranteed_to_children_under_18",
    options: [
      {
        key: "answers.right_to_entrepreneurship",
        value: "entrepreneurship",
      },
      { key: "answers.right_to_vote", value: "vote" },
      { key: "answers.right_to_guardianship", value: "guardianship" },
      { key: "answers.right_to_weapons", value: "weapons" },
    ],
    correctAnswer: "guardianship",
  },
  {
    id: 28,
    questionKey: "tests.self_defense_right_derived_from",
    options: [
      { key: "answers.education", value: "education" },
      { key: "answers.life", value: "life" },
      { key: "answers.movement", value: "movement" },
      { key: "answers.speech", value: "speech" },
    ],
    correctAnswer: "life",
  },
  {
    id: 29,
    questionKey: "tests.can_censorship_apply_to_artistic_expression",
    options: [
      { key: "answers.censorship_mandatory", value: "mandatory" },
      { key: "answers.yes_always", value: "always" },
      { key: "answers.no_if_not_violate_others_rights", value: "no" },
      { key: "answers.only_painting", value: "painting" },
    ],
    correctAnswer: "no",
  },
  {
    id: 30,
    questionKey: "tests.property_inviolability_means",
    options: [
      { key: "answers.cannot_sell", value: "sell" },
      { key: "answers.cannot_inherit", value: "inherit" },
      { key: "answers.cannot_gift", value: "gift" },
      { key: "answers.cannot_arbitrarily_take", value: "take" },
    ],
    correctAnswer: "take",
  },
  {
    id: 31,
    questionKey: "tests.which_right_allows_spreading_facts_ideas",
    options: [
      { key: "answers.right_to_medical_care", value: "medical" },
      {
        key: "answers.right_to_free_information_dissemination",
        value: "information",
      },
      { key: "answers.right_to_fair_trial", value: "trial" },
      { key: "answers.right_to_education", value: "education" },
    ],
    correctAnswer: "information",
  },
  {
    id: 32,
    questionKey: "tests.reasonable_time_frame_ensures",
    options: [
      { key: "answers.automatic_case_closing", value: "closing" },
      { key: "answers.case_not_drag_too_long", value: "not_long" },
      { key: "answers.increased_fines", value: "fines" },
      { key: "answers.quick_punishment", value: "punishment" },
    ],
    correctAnswer: "not_long",
  },
  {
    id: 33,
    questionKey: "tests.must_safety_be_ensured_during_trial",
    options: [
      { key: "answers.only_for_prosecutors", value: "prosecutors" },
      { key: "answers.yes", value: "yes" },
      { key: "answers.no", value: "no" },
      { key: "answers.only_for_judges", value: "judges" },
    ],
    correctAnswer: "yes",
  },
  {
    id: 34,
    questionKey: "tests.effective_decision_enforcement_means",
    options: [
      { key: "answers.partial_enforcement", value: "partial" },
      { key: "answers.enforcement_as_desired", value: "desired" },
      { key: "answers.timely_complete_enforcement", value: "timely" },
      { key: "answers.no_enforcement", value: "none" },
    ],
    correctAnswer: "timely",
  },
  {
    id: 35,
    questionKey: "tests.which_right_protects_copyright_trademark",
    options: [
      {
        key: "answers.right_to_non_material_property",
        value: "non_material",
      },
      { key: "answers.right_to_education", value: "education" },
      { key: "answers.right_to_material_property", value: "material" },
      { key: "answers.right_to_weapons", value: "weapons" },
    ],
    correctAnswer: "non_material",
  },
  {
    id: 36,
    questionKey: "tests.compensation_for_property_damage_means",
    options: [
      { key: "answers.apology_only", value: "apology" },
      { key: "answers.full_compensation", value: "full" },
      { key: "answers.partial_compensation", value: "partial" },
      { key: "answers.nothing", value: "nothing" },
    ],
    correctAnswer: "full",
  },
  {
    id: 37,
    questionKey: "tests.does_policy_protect_respect_for_dignity",
    options: [
      { key: "answers.only_for_children", value: "children" },
      { key: "answers.yes_integral_part_of_right_to_life", value: "yes" },
      { key: "answers.only_in_hospitals", value: "hospitals" },
      { key: "answers.no_only_officials_deserve_respect", value: "no" },
    ],
    correctAnswer: "yes",
  },
  {
    id: 38,
    questionKey: "tests.personal_integrity_forbids",
    options: [
      { key: "answers.changing_personal_data", value: "data" },
      { key: "answers.changing_hairstyle", value: "hairstyle" },
      { key: "answers.wearing_specific_clothing", value: "clothing" },
      { key: "answers.any_violence_humiliation", value: "violence" },
    ],
    correctAnswer: "violence",
  },
  {
    id: 39,
    questionKey: "tests.what_is_foundation_for_dialogue",
    options: [
      { key: "answers.right_to_weapons", value: "weapons" },
      { key: "answers.freedom_of_thought_speech", value: "speech" },
      { key: "answers.right_to_trial", value: "trial" },
      { key: "answers.right_to_property", value: "property" },
    ],
    correctAnswer: "speech",
  },
  {
    id: 40,
    questionKey: "tests.human_rights_policy_created_for",
    options: [
      { key: "answers.total_control_by_force", value: "control" },
      { key: "answers.isolation_of_people", value: "isolation" },
      {
        key: "answers.peaceful_coexistence_mutual_respect",
        value: "coexistence",
      },
      { key: "answers.competition_struggle", value: "competition" },
    ],
    correctAnswer: "coexistence",
  },
  {
    id: 41,
    questionKey: "tests.right_to_refuse_parenting_without_discrimination",
    options: [
      { key: "answers.only_after_50", value: "50" },
      { key: "answers.only_medical_reasons", value: "medical" },
      { key: "answers.no", value: "no" },
      { key: "answers.yes", value: "yes" },
    ],
    correctAnswer: "yes",
  },
  {
    id: 42,
    questionKey: "tests.property_protection_includes",
    options: [
      { key: "answers.protection_from_taxes", value: "taxes" },
      {
        key: "answers.protection_from_encroachments",
        value: "encroachments",
      },
      { key: "answers.protection_from_inflation", value: "inflation" },
      {
        key: "answers.protection_from_natural_disasters",
        value: "disasters",
      },
    ],
    correctAnswer: "encroachments",
  },
  {
    id: 43,
    questionKey: "tests.right_to_form_clubs_communities",
    options: [
      { key: "answers.right_to_property", value: "property" },
      {
        key: "answers.right_to_freedom_of_association",
        value: "association",
      },
      { key: "answers.right_to_life", value: "life" },
      { key: "answers.right_to_independent_trial", value: "trial" },
    ],
    correctAnswer: "association",
  },
  {
    id: 44,
    questionKey: "tests.presumption_of_innocence_effective",
    options: [
      { key: "answers.until_suspect_arrest", value: "arrest" },
      { key: "answers.after_verdict", value: "verdict" },
      { key: "answers.until_court_decision_final", value: "final" },
      { key: "answers.never", value: "never" },
    ],
    correctAnswer: "final",
  },
  {
    id: 45,
    questionKey: "tests.is_expression_through_clothing_protected",
    options: [
      { key: "answers.only_for_artists", value: "artists" },
      { key: "answers.only_at_home", value: "home" },
      { key: "answers.no", value: "no" },
      { key: "answers.yes", value: "yes" },
    ],
    correctAnswer: "yes",
  },
  {
    id: 46,
    questionKey: "tests.medical_care_belongs_to",
    options: [
      { key: "answers.right_to_trial", value: "trial" },
      { key: "answers.right_to_movement", value: "movement" },
      { key: "answers.right_to_life", value: "life" },
      { key: "answers.right_to_property", value: "property" },
    ],
    correctAnswer: "life",
  },
  {
    id: 47,
    questionKey: "tests.what_is_always_prohibited",
    options: [
      { key: "answers.refusing_work", value: "work" },
      { key: "answers.torture_cruel_treatment", value: "torture" },
      { key: "answers.changing_residence", value: "residence" },
      { key: "answers.carrying_weapons", value: "weapons" },
    ],
    correctAnswer: "torture",
  },
  {
    id: 48,
    questionKey: "tests.psychological_help_belongs_to",
    options: [
      { key: "answers.right_to_movement", value: "movement" },
      { key: "answers.right_to_education", value: "education" },
      { key: "answers.right_to_property", value: "property" },
      { key: "answers.right_to_life", value: "life" },
    ],
    correctAnswer: "life",
  },
  {
    id: 49,
    questionKey: "tests.right_to_access_natural_resources",
    options: [
      { key: "answers.only_summer", value: "summer" },
      { key: "answers.only_for_payment", value: "payment" },
      { key: "answers.yes", value: "yes" },
      { key: "answers.no", value: "no" },
    ],
    correctAnswer: "yes",
  },
  {
    id: 50,
    questionKey: "tests.main_goal_of_all_rights",
    options: [
      {
        key: "answers.increase_financial_inequality",
        value: "inequality",
      },
      { key: "answers.ban_free_speech", value: "ban_speech" },
      { key: "answers.strengthen_officials_control", value: "control" },
      {
        key: "answers.peaceful_coexistence_mutual_respect",
        value: "peaceful",
      },
    ],
    correctAnswer: "peaceful",
  },
];

// Function to get random 10 tests for a user
export const getRandomTestsForUser = () => {
  const shuffled = [...humanRightsTests].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
};

// Utility function to get test by ID
export const getTestById = (id) => {
  return humanRightsTests.find((test) => test.id === id);
};

// Utility function to get all tests
export const getAllTests = () => {
  return humanRightsTests;
};
