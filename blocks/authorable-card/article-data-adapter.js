function createThumbnailURL(result) {
  let thumbnail = '';
  if (result.contentType === 'Course') {
    [, thumbnail] = result['Full Meta'].match(/course-thumbnail: (.*)/);
    return thumbnail ? `https://cdn.experienceleague.adobe.com/thumb/${thumbnail.split('thumb/')[1]}` : '';
  }

  if (result.contentType === 'Tutorial') {
    const videoUrl = result['Full Body'].match(/embedded-video src\s*=\s*['"]?([^'"]*)['"]?/)[1];
    result.videoUrl = videoUrl;
    [, result.videoId] = videoUrl.match(/\/v\/([^/]*)/);
    thumbnail = result.videoId ? `https://video.tv.adobe.com/v/${result.videoId}?format=jpeg` : '';
  }
  return thumbnail;
}

export default async function mapResultToCardsData(result, placeholders) {
  return {
    contentType: result.contentType,
    type: result.contentType,
    badgeTitle: result.contentType,
    thumbnail: createThumbnailURL(result),
    product: result.Solution[0],
    title: result.Title,
    description: result.Description,
    tags: result.Tags,
    copyLink: result.URL,
    bookmarkLink: '',
    viewLink: result.URL,
    viewLinkText: placeholders[`viewLink${result?.contentType}`]
      ? placeholders[`viewLink${result?.contentType}`]
      : `View ${result?.contentType}`,
  };
}
