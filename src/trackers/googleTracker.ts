import { google } from 'googleapis';
import { getEnv } from '../data/utils';

const SCOPES_GMAIL = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
];

export const getOauthClient = () => {
  const GOOGLE_CLIENT_ID = getEnv({ name: 'GOOGLE_CLIENT_ID' });
  const GOOGLE_CLIENT_SECRET = getEnv({ name: 'GOOGLE_CLIENT_SECRET' });
  const GMAIL_REDIRECT_URL = getEnv({ name: 'GMAIL_REDIRECT_URL' });

  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_REDIRECT_URL);
};

/**
 * Get auth url defends on google services such us gmail, calendar
 */
export const getAuthorizeUrl = () => {
  const oauthClient = getOauthClient();

  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES_GMAIL,
  });
};

export const getAccessToken = (code: string) => {
  const oauthClient = getOauthClient();

  return new Promise((resolve, reject) =>
    oauthClient.getToken(code, (err: any, token: any) => {
      if (err) {
        return reject(err.response.data.error);
      }

      return resolve(token);
    }),
  );
};

export const createMeetEvent = (credentials, event) => {
  const auth = getOauthClient();

  auth.setCredentials(credentials);

  const calendar: any = google.calendar({ version: 'v3', auth });

  return new Promise((resolve, reject) => {
    calendar.events.insert(
      {
        auth,
        calendarId: 'primary',
        resource: {
          description: event.summary,
          conferenceData: {
            createRequest: { requestId: Math.random() },
          },
          ...event,
        },
        conferenceDataVersion: 1,
      },

      (error, response) => {
        if (error) {
          return reject(error);
        }

        return resolve(response.data);
      },
    );
  });
};

export const googleUtils = {
  getAccessToken,
};
