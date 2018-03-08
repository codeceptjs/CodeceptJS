
const Helper = require('../helper');
const requireg = require('requireg');
const imap = require('imap-simple');


/**
 * @description Helper for aiding in retrieving email information through IMAP
 * - This helper can be used for validating information within emails
 * - Tested using GMAIL and OUTLOOK accounts
 * - Makes use of [imap-simple] (https://www.npmjs.com/package/imap-simple)
 * @example
 * // Getting all new emails from an inbox:
 * let parsedEmails = yield I.grabInboxUnseenEmails();
 * // Recursively analyze email bodies:
 * for (let email of parsedEmails.emails) {
 *     console.log(JSON.stringify(email, null, 4));
 * }
 */
class ImapEmail extends Helper {
  constructor(config) {
    super(config);
    this.options = {
      user: 'email@address.com',
      password: 'base64',
      decode: true,
      host: 'imap.domain.com',
      port: 0,
      tls: true,
      authTimeout: 10000,
      markAsSeen: true,
    };
    this.options = Object.assign(this.options, config);
    if (this.options.decode) this.options.password = Buffer.from(this.options.password, 'base64').toString('ascii');
  }

  static _checkRequirements() {
    try {
      requireg('imap-simple');
    } catch (e) {
      return ['imap-simple'];
    }
  }

  async _getConnectionToImap() {
    return await imap.connect({ imap: this.options });
  }

  async _setImapInbox(conn, box = 'INBOX') {
    return await conn.openBox(box);
  }

  async _getParsedEmailsFromSearchResult(res) {
    let arrEmails = [],
      theEmail = {},
      parsed = {},
      arrParts = {};
    res = JSON.parse(res);
    for (let x = 0; x < res.length; x++) {
      parsed = {};
      theEmail = Object.assign({}, res[x]);
      parsed.emailNumber = theEmail.seqNo;
      for (let y = 0; y < theEmail.parts.length; y++) {
        arrParts = Object.assign({}, theEmail.parts[y]);
        if (arrParts.which.toUpperCase() == 'HEADER') {
          parsed.emailHeader = {};
          parsed.emailHeader.emailSubject = arrParts.body.subject[0];
          parsed.emailHeader.emailFrom = arrParts.body.from[0];
          continue;
        } else if (arrParts.which.toUpperCase() == 'TEXT') {
          parsed.emailBody = arrParts.body;
          continue;
        } else {
          parsed.raw = Object.assign({}, arrParts);
          continue;
        }
      }
      parsed.emailParsedCounter = x;
      arrEmails.push(parsed);
    }
    return arrEmails;
  }

  async _connectFetchParseProvide(criteriaToFetch = ['UNSEEN'], boxToFetch = 'INBOX', markSeenAfterFetch = true) {
    let parsedEmails = [],
      searchCriteria = [];
    let topHeader = {},
      returnObject = {},
      fetchOptions = {};
    let conn,
      box,
      searchResults;
    conn = await this._getConnectionToImap();
    box = await this._setImapInbox(conn, boxToFetch);
    searchCriteria = criteriaToFetch.slice();
    fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: markSeenAfterFetch };
    searchResults = await conn.search(searchCriteria, fetchOptions);
    parsedEmails = await this._getParsedEmailsFromSearchResult(JSON.stringify(searchResults));
    conn.end();
    topHeader.emailFetchCriteria = criteriaToFetch.slice();
    topHeader.emailFetchBox = boxToFetch;
    topHeader.emailSeen = markSeenAfterFetch;
    topHeader.emailBoxMessages = box.messages;
    returnObject.parseInformation = topHeader;
    returnObject.emails = parsedEmails.slice();
    return returnObject;
  }

  /**
     * @function
     * @description Set a flag to mark emails as SEEN as they are retrieved
     * ```
     * I.markFetchedEmailsAsSeen();  // To set flag TRUE
     * ```
     */
  markFetchedEmailsAsSeen() {
    this.options.markAsSeen = true;
  }

  /**
     * @function
     * @description Set a flag to not mark emails as SEEN as they are retrieved and leave them UNSEEN
     * ```
     * I.dontMarkFetchedEmailsAsSeen();  // To set flag FALSE
     * ```
     */
  dontMarkFetchedEmailsAsSeen() {
    this.options.markAsSeen = false;
  }

  /**
     * @function
     * @async
     * @description Retrieve emails from INBOX _(by default)_
     * ```
     * emails = await I.grabInboxUnseenEmails();
     * // "emails" is an object
     * ```
     */
  async grabInboxUnseenEmails() {
    const searchCriteria = ['UNSEEN'];
    return await this._connectFetchParseProvide(searchCriteria, 'INBOX', this.options.markAsSeen);
  }

  /**
     * @function
     * @async
     * @description Retrieve today's emails from an email box _(INBOX by default)_
     * ```
     * emails = await I.grabTodayEmails();
     * // box name can be specified, only matching today's date
     * ```
     */
  async grabTodayEmails(boxToFetchFrom = 'INBOX') {
    let today = new Date();
    today = today.toISOString();
    const searchCriteria = [['SINCE', today]];
    return await this._connectFetchParseProvide(searchCriteria, boxToFetchFrom, this.options.markAsSeen);
  }

  /**
     * @function
     * @async
     * @description Retrieve emails from a specific sender within an email box _(INBOX by default)_
     * ```
     * emails = await I.grabEmailsFrom('randomdude@email.com','JUNK');
     * ```
     */
  async grabEmailsFrom(from, boxToFetchFrom = 'INBOX') {
    const searchCriteria = [['FROM', from]];
    return await this._connectFetchParseProvide(searchCriteria, boxToFetchFrom, this.options.markAsSeen);
  }

  /**
     * @function
     * @async
     * @description Retrieve emails with specific content within email BODY within an email box _(INBOX by default)_
     * ```
     * emails = await I.grabEmailsMatchingText('payment due today');
     * ```
     */
  async grabEmailsMatchingText(textToMatch, boxToFetchFrom = 'INBOX') {
    const searchCriteria = [['TEXT', textToMatch]];
    return await this._connectFetchParseProvide(searchCriteria, boxToFetchFrom, this.options.markAsSeen);
  }

  /**
     * @function
     * @async
     * @description Retrieve emails with custom matching criteria within an email box _(INBOX by default)_
     * ```
     * emails = await I.grabEmailsUsingCustomSearchCriteria('payment due today');
     * // Criteria specified must be an array based on Imap-Simple implementation
     * ```
     */
  async grabEmailsUsingCustomSearchCriteria(searchCriteria, boxToFetchFrom = 'INBOX') {
    return await this._connectFetchParseProvide(searchCriteria, boxToFetchFrom, this.options.markAsSeen);
  }
}

module.exports = ImapEmail;
