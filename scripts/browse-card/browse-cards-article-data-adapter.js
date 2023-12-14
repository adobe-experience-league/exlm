const BrowseCardsArticleDataAdaptor = (() => {
  const createThumbnailURL = (thumb) => {
    console.log(thumb);
    return thumb ? `https://cdn.experienceleague.adobe.com/thumb/${thumb.split('thumb/')[1]}` : '';
    // return `https://cdn.experienceleague.adobe.com/thumb/get-started-with-marketo-engage-for-new-marketing-practitioners.png`
  };

  const mapResultToCardsData = (result) => {
    console.log(result);
    return {
      contentType: result.contentType,
      badgeTitle: result.contentType,
      thumbnail: createThumbnailURL(result.Thumbnail),
      product: result.Solution[0],
      title: result.Title,
      description: result.Description,
      tags: result.Tags,
      // event: {
      //   startTime: '',
      //   endTime: '',
      // },
      // contributor: {
      //   thumbnail: '',
      //   name: '',
      //   level: '',
      //   date: '',
      // },
      copyLink: result.URL,
      bookmarkLink: '',
      viewLink: result.URL,
      viewLinkText: 'View',
    };
  };

  return {
    mapResultToCardsData,
  };
})();

export default BrowseCardsArticleDataAdaptor;
