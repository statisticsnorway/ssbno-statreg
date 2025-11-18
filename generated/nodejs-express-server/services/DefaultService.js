/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* List all kortnavn
*
* no response value expected for this operation
* */
const kortnavnGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Get statistics under a kortnavn
*
* name String 
* no response value expected for this operation
* */
const kortnavnNameGET = ({ name }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        name,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update a kortnavn
*
* name String 
* body oas_any_type_not_mapped 
* no response value expected for this operation
* */
const kortnavnNamePUT = ({ name, body }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        name,
        body,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Create a kortnavn
*
* body oas_any_type_not_mapped 
* no response value expected for this operation
* */
const kortnavnPOST = ({ body }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        body,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List all publications
*
* no response value expected for this operation
* */
const publiseringGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Get a publication
*
* id String 
* no response value expected for this operation
* */
const publiseringIdGET = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update a publication
*
* id String 
* body oas_any_type_not_mapped 
* no response value expected for this operation
* */
const publiseringIdPUT = ({ id, body }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        body,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List publications for a variant
*
* variantId String 
* no response value expected for this operation
* */
const publiseringKalenderHelligOgSperredeDagerGET = ({ variantId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        variantId,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Create a publication
*
* body oas_any_type_not_mapped 
* no response value expected for this operation
* */
const publiseringPOST = ({ body }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        body,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List publications for a variant
*
* variantId String 
* no response value expected for this operation
* */
const publiseringVariantVariantIdGET = ({ variantId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        variantId,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List all sections
*
* no response value expected for this operation
* */
const seksjonerGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List statistics owned by a section
*
* kode String 
* no response value expected for this operation
* */
const seksjonerKodeGET = ({ kode }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        kode,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List all statistics
*
* no response value expected for this operation
* */
const statisticsGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Get a statistic
*
* id String 
* returns statistic
* */
const statisticsIdGET = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update a statistic
*
* id String 
* body oas_any_type_not_mapped 
* no response value expected for this operation
* */
const statisticsIdPUT = ({ id, body }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        body,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List all kortnavn under all statistics
*
* no response value expected for this operation
* */
const statisticsKortnavnGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Create a statistic
*
* body oas_any_type_not_mapped 
* no response value expected for this operation
* */
const statisticsPOST = ({ body }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        body,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List all variants under all statistics
*
* no response value expected for this operation
* */
const statisticsVariantsGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List all variants
*
* no response value expected for this operation
* */
const variantsGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Get a variant
*
* id String 
* no response value expected for this operation
* */
const variantsIdGET = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Update a variant
*
* id String 
* body oas_any_type_not_mapped 
* no response value expected for this operation
* */
const variantsIdPUT = ({ id, body }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        body,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Create a variant
*
* body oas_any_type_not_mapped 
* no response value expected for this operation
* */
const variantsPOST = ({ body }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        body,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  kortnavnGET,
  kortnavnNameGET,
  kortnavnNamePUT,
  kortnavnPOST,
  publiseringGET,
  publiseringIdGET,
  publiseringIdPUT,
  publiseringKalenderHelligOgSperredeDagerGET,
  publiseringPOST,
  publiseringVariantVariantIdGET,
  seksjonerGET,
  seksjonerKodeGET,
  statisticsGET,
  statisticsIdGET,
  statisticsIdPUT,
  statisticsKortnavnGET,
  statisticsPOST,
  statisticsVariantsGET,
  variantsGET,
  variantsIdGET,
  variantsIdPUT,
  variantsPOST,
};
