export const CUSTOM_CONTEXT_LIST = ['entitlements', 'role', 'interests', 'industryInterests'];

export const COVEO_SEARCH_CUSTOM_EVENTS = {
  PREPROCESS: 'PREPROCESS_COVEO_REQUEST',
  PROCESS_SEARCH_RESPONSE: 'PROCESS_SEARCH_RESPONSE',
  READY: 'COVEO_SEARCH_READY',
};

export const getUserData = (key) => {
  const data = JSON.parse(sessionStorage.getItem('profile')) || {};
  return Object.fromEntries(data[key]?.map((value, index) => [index.toString(), value]) || []);
};

export const generateMlParameters = (productKey) => ({
  filters: {
    originLevel1: 'Experience League Learning Hub',
    originLevel2: 'default',
    c_context_learning_product: productKey,
  },
});

export const generateCustomContext = (productKey) =>
  CUSTOM_CONTEXT_LIST.reduce(
    (contextValues, key) => {
      contextValues[key] = getUserData(key);
      return contextValues;
    },
    {
      learning_product: productKey,
    },
  );
