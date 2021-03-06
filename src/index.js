// import function for matrix conversion from wrong json (got from csv to json converter) to correct one one. only needed for development
// import { prepareMatrixes } from "./js/utils/prepareMatrixes.js";
// prepareMatrixes();

//import logo and qr code images
import openBrokerLogo from "./images/open-logo.svg";
import graphImage from "./images/graph.svg";
import humanIcon from "./images/human-icon.svg";
import medalIcon from "./images/medal-icon.svg";
import presentIcon from "./images/present-icon.svg";
import cardIcon from "./images/card-icon.svg";

// import styles, components and modules
import "./index.css";
import Header from "./js/components/Header.js";
// import LoginForm from "./js/components/LoginForm.js";
import Form from "./js/components/Form.js";
import Portfolio from "./js/modules/Portfolio.js";
import ExchangeRatesApi from "./js/modules/ExchangeRatesApi.js";
import Report from "./js/components/Report.js";
import Recommendation from "./js/components/Recommendation.js";
import Terminal from "./js/components/Terminal.js";
import Footer from "./js/components/Footer.js";

// import various scales, matrixes and dicts for correct portfolio selection
import { MATRIX_CUR_FULL } from "./js/constants/matrixes/matrix_cur_full.js";
import { MATRIX_CUR_LB } from "./js/constants/matrixes/matrix_cur_lb.js";
import { MATRIX_CUR_NONE } from "./js/constants/matrixes/matrix_cur_none.js";
import { MATRIX_CUR_READY } from "./js/constants/matrixes/matrix_cur_ready.js";
import { MATRIX_CUR_REC } from "./js/constants/matrixes/matrix_cur_rec.js";
import { MATRIX_RUB_FULL } from "./js/constants/matrixes/matrix_rub_full.js";
import { MATRIX_RUB_LB } from "./js/constants/matrixes/matrix_rub_lb.js";
import { MATRIX_RUB_NONE } from "./js/constants/matrixes/matrix_rub_none.js";
import { MATRIX_RUB_READY } from "./js/constants/matrixes/matrix_rub_ready.js";
import { MATRIX_RUB_REC } from "./js/constants/matrixes/matrix_rub_rec.js";

import { MONEY_SCALE, RISK_MATRIX, GOAL_ARRAY } from "./js/constants/scales.js";
import { RECS_LIST } from "./js/constants/recs-list.js";
import { FILTER_DICT } from "./js/constants/filter-dict.js";
import { RECOMMENDATION_MATRIX } from "./js/constants/recommendation-matrix.js";
import { CATALOGUE } from "./js/constants/catalogue.js";

import { moneyInputFormatter } from "./js/utils/moneyInputFormatter";

// import constants required for exchange rates api
import {
  BASE_URL,
  METHOD,
  APP_ID,
} from "./js/constants/exchange-rates-api-url.js";
import { TERMINAL_CONTENT } from "./js/constants/terminal-content.js";

const rootElement = document.querySelector(".root");

const mainElement = document.createElement("main");
mainElement.classList.add("main");

// const loginForm = new LoginForm({
//   container: rootElement,
// });

const header = new Header({
  container: rootElement,
  openBrokerLogo,
});

// create components instances passing required props regardless user question responses
const form = new Form({
  container: mainElement,
  moneyScale: MONEY_SCALE,
  riskMatrix: RISK_MATRIX,
  GOAL_ARRAY,
  openBrokerLogo,
  graphImage,
});

const report = new Report({
  container: mainElement,
  openBrokerLogo,
});

const recommendation = new Recommendation({
  container: mainElement,
  recsCatalogue: RECS_LIST,
  recommendationMatrix: RECOMMENDATION_MATRIX,
  openBrokerLogo,
  cardIcon,
  humanIcon,
  medalIcon,
  presentIcon,
});

const terminal = new Terminal({
  container: mainElement,
  terminalContent: TERMINAL_CONTENT,
  openBrokerLogo,
});

const footer = new Footer({
  container: rootElement,
  openBrokerLogo,
});

// create api instance and passing props
const exchangeRatesApi = new ExchangeRatesApi({
  baseUrl: BASE_URL,
  method: METHOD,
  appId: APP_ID,
});

// create portfolio instance, used in portfolio selection process
const portfolio = new Portfolio({
  catalogue: CATALOGUE,
  filterDict: FILTER_DICT,
  recsCatalogue: RECS_LIST,

  matrixCurFull: MATRIX_CUR_FULL,
  matrixCurLb: MATRIX_CUR_LB,
  matrixCurNone: MATRIX_CUR_NONE,
  matrixCurReady: MATRIX_CUR_READY,
  matrixCurRec: MATRIX_CUR_REC,
  matrixRubFull: MATRIX_RUB_FULL,
  matrixRubLb: MATRIX_RUB_LB,
  matrixRubNone: MATRIX_RUB_NONE,
  matrixRubReady: MATRIX_RUB_READY,
  matrixRubRec: MATRIX_RUB_REC,
});

// creates filter element in form component
// form.insertLogo();
// form.createFilter();

header.createHeader();

// loginForm.createLoginForm();

// rootElement.appendChild(mainElement);
footer.createFooter();

rootElement.insertBefore(mainElement, footer.footerElement);

form.createFormSection();
report.createReportSection();
recommendation.createRecommendationsSection();

// requests exchange rates from https://api.exchangeratesapi.io/, returns promise
// and then updates rates in form and report component instances
// and afterwards executes the function that handles all the process in portfolio selection
exchangeRatesApi
  .getRates()
  .then((response) => {
    // console.log(response.rates);
    const usdPrice = 1 / response.rates.RUB;
    const euPrice = response.rates.EUR * usdPrice;
    const rates = { EUR: euPrice, USD: usdPrice };

    // temporary rates to code in internet absence
    // const tempRates = { EUR: 0.0125875781, USD: 0.0142063406 };
    // report.updatePrices(tempRates);

    form.updatePrices(rates);
    report.updatePrices(rates);
    // handleChanges();
  })
  .catch((error) => {
    console.log(error);
  });

// function that handles any changes in form responses and
const handleChanges = () => {
  // form methods that get answers, investment amount and filter selections
  // and assign risk profiles, portfolio keys and due date for portfolio selection
  form.getAnswers();

  form.assignRiskProfile();
  form.assignPortfolioKeys();
  form.assignDueDate();

  // update portfolio with required data from form component
  portfolio.getData({
    portfolioKeys: form.portfolioKeys,
    dueDate: form.dueDate,
    investmentAmount: form.investmentAmount,
    investmentAmountRubbles: form.investmentAmountRubbles,
    isCurrency: form.isCurrency,
    currency: form.currency,
    helpRequestString: form.helpRequestString,
    helpRequestTicked: form.helpRequestTicked,
  });

  portfolio.selectPapers();

  // update report with required data from portfolio component
  report.updateReportData({
    portfolio: portfolio.portfolio,
    currency: portfolio.currency,
  });

  // update recommendation with required data from form and portfolio components
  recommendation.updateRecommendation(
    portfolio.investmentAmountRubbles,
    portfolio.currency,
    form.helpRequestString
  );

  // render report, recommendation and terminal sections
  report.renderReport();
  recommendation.renderRecommendation();
  terminal.renderTerminal();
};

// add eventlisteneer to refresh button to get new portfolio rendered
form.refreshButtonElement.addEventListener("click", (event) => {
  event.preventDefault();
  handleChanges();
});

form.printButtonElement.addEventListener("click", (event) => {
  event.preventDefault();
  // form.getClientId();

  // if (report.reportIsRendered && form.clientId) {
  window.print();
  // } else {
  //   alert("Нет сгенерированного портфеля или id клиента!");
  // }
});

// add eventlistener to form element, handles changes only if input was via checkbox dropdown or text input
// AND investment amount in rubles is more than 10000 (Portfolio can find portfolio for lower sums of money,
// but either will get and error or it's not feasible in terms of investing)
// form.formElement.addEventListener("input", (event) => {
//   if (
//     event.target.classList.contains("question__dropdown") ||
//     event.target.classList.contains("question__input-text") ||
//     event.target.classList.contains("question__checkbox")
//   ) {
//     handleChanges();
//   }
// });

[
  form.startQuestionInputTextElement,
  form.sumQuestionInputTextElement,
  form.installmentQuestionInputTextElement,
].forEach((element) => element.addEventListener("input", moneyInputFormatter));

// add click event listener to form element that works only when clicked on filter buttons and updates filters' state
// loginForm.loginFormElement.addEventListener("submit", (event) => {
//   event.preventDefault();
//   rootElement.removeChild(loginForm.loginFormElement);
//   rootElement.insertBefore(mainElement, footer.footerElement);
// });
