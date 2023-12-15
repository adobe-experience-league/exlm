import { fetchPlaceholders } from '../lib-franklin.js';

export default class BrowseCardsArticleDataAdaptor {
  createViewLinkText() {
    this.viewLinkTextPlaceholder = '';
    if (this.result.contentType === 'Course') {
      this.viewLinkTextPlaceholder = 'viewLinkCourse';
    }
    if (this.result.contentType === 'Tutorial') {
      this.viewLinkTextPlaceholder = 'viewLinkTutorial';
    }
    if (this.result.contentType === 'Article') {
      this.viewLinkTextPlaceholder = 'viewLinkArticle';
    }
    if (this.result.contentType === 'Documentation') {
      this.viewLinkTextPlaceholder = 'viewLinkDocumentation';
    }
    if (this.result.contentType === 'Event') {
      this.viewLinkTextPlaceholder = 'viewLinkEvent';
    }
  }

  createThumbnailURL() {
    let thumbnail = '';
    if (this.result.contentType === 'Course') {
      [, thumbnail] = this.result['Full Meta'].match(/course-thumbnail: (.*)/);
      return thumbnail ? `https://cdn.experienceleague.adobe.com/thumb/${thumbnail.split('thumb/')[1]}` : '';
    }

    if (this.result.contentType === 'Tutorial') {
      const videoUrl = this.result['Full Body'].match(/embedded-video src\s*=\s*['"]?([^'"]*)['"]?/)[1];
      this.result.videoUrl = videoUrl;
      this.result.videoId = videoUrl?.split('/')[4];
      return this.result.videoId ? `https://video.tv.adobe.com/v/${this.result.videoId}?format=jpeg` : '';
    }
    return thumbnail;
  }

  mapResultToCardsData = async (result) => {
    this.result = result;
    this.createViewLinkText();
    const placeholders = await fetchPlaceholders();

    return {
      contentType: result.contentType,
      badgeTitle: result.contentType,
      thumbnail: this.createThumbnailURL(),
      product: result.Solution[0],
      title: result.Title,
      description: result.Description,
      tags: result.Tags,
      copyLink: result.URL,
      bookmarkLink: '',
      viewLink: result.URL,
      viewLinkText: placeholders[this.viewLinkTextPlaceholder]
        ? placeholders[this.viewLinkTextPlaceholder]
        : `View ${this.result.contentType}`,
    };
  };
}
