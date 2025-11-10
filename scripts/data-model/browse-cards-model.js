const browseCardDataModel = {
  id: '',
  contentType: '',
  badgeTitle: '',
  thumbnail: '',
  product: [],
  title: '',
  description: '',
  meta: {},
  // TODO: Cleanup all the meta properties and add it under meta object dynamically based on the contentType
  tags: [],
  event: {
    time: '',
  },
  contributor: {
    thumbnail: '',
    name: '',
    level: '',
    date: '',
  },
  authorInfo: {
    name: '',
    type: '',
  },
  copyLink: '',
  bookmarkLink: '',
  viewLink: '',
  viewLinkText: '',
  inProgressText: '',
  inProgressStatus: '',
  el_course_duration: '',
  el_course_module_count: '',
  el_level: '',
};

export default browseCardDataModel;
