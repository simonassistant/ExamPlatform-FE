// This is just an example,
// so you can safely delete all default props below

export default {
  failed: 'Action failed',
  success: 'Action was successful',
  paper: {
    newTitle: 'New Paper',
    editTitle: 'Edit Paper',
    details: 'Paper Details',
    sections: 'Sections',
    addSection: 'Add Section',
    questionGroups: 'Question Groups',
    questions: 'Questions',
    save: 'Save',
    preview: 'Preview',
    undoTooltip: 'Undo (Ctrl+Z)',
    redoTooltip: 'Redo (Ctrl+Y)',
    validation: {
      error: 'Error',
      warning: 'Warning',
      unsaved: 'Unsaved changes',
      saved: 'Saved',
      titleRequired: 'Paper title is required',
      durationRequired: 'Duration should be set',
      sectionRequired: 'At least one section is required',
      sectionNameRequired: 'Section {n} name is required',
      groupRequired: 'Section {n} has no question groups',
      questionContentRequired: 'Question {n} content is required',
      minOptions: 'Question {n} needs at least 2 options',
      correctOption: 'Question {n} must have a correct answer'
    }
  },
  schedule: {
    newTitle: 'New Schedule',
    editTitle: 'Edit Schedule',
    details: 'Schedule Details',
    sessions: 'Sessions',
    addSession: 'Add Session',
    save: 'Save'
  },
  assignment: {
    conflict: 'Assignment conflicts with existing schedule',
    locked: 'Assignment is locked (exam already started)',
    notFound: 'Assignment not found'
  }
};
