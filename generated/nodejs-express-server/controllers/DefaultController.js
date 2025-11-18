/**
 * The DefaultController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic routes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/DefaultService');
const kortnavnGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.kortnavnGET);
};

const kortnavnNameGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.kortnavnNameGET);
};

const kortnavnNamePUT = async (request, response) => {
  await Controller.handleRequest(request, response, service.kortnavnNamePUT);
};

const kortnavnPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.kortnavnPOST);
};

const publiseringGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.publiseringGET);
};

const publiseringIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.publiseringIdGET);
};

const publiseringIdPUT = async (request, response) => {
  await Controller.handleRequest(request, response, service.publiseringIdPUT);
};

const publiseringKalenderHelligOgSperredeDagerGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.publiseringKalenderHelligOgSperredeDagerGET);
};

const publiseringPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.publiseringPOST);
};

const publiseringVariantVariantIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.publiseringVariantVariantIdGET);
};

const seksjonerGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.seksjonerGET);
};

const seksjonerKodeGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.seksjonerKodeGET);
};

const statisticsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.statisticsGET);
};

const statisticsIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.statisticsIdGET);
};

const statisticsIdPUT = async (request, response) => {
  await Controller.handleRequest(request, response, service.statisticsIdPUT);
};

const statisticsKortnavnGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.statisticsKortnavnGET);
};

const statisticsPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.statisticsPOST);
};

const statisticsVariantsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.statisticsVariantsGET);
};

const variantsGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.variantsGET);
};

const variantsIdGET = async (request, response) => {
  await Controller.handleRequest(request, response, service.variantsIdGET);
};

const variantsIdPUT = async (request, response) => {
  await Controller.handleRequest(request, response, service.variantsIdPUT);
};

const variantsPOST = async (request, response) => {
  await Controller.handleRequest(request, response, service.variantsPOST);
};


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
