import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

// tslint:disable-next-line
const { parentPort, workerData } = require('worker_threads');

import { pubsub } from '../data/resolvers/subscriptions';
import { Companies, Customers, ImportHistory } from '../db/models';

dotenv.config();

const { MONGO_URL = '' } = process.env;

mongoose.connect(
  MONGO_URL,
  { useNewUrlParser: true, useCreateIndex: true },
  async err => {
    if (err) {
      console.log('error', err);
    }

    const { result, contentType, properties, user, importHistoryId, percentagePerData } = workerData;

    let create: any = Customers.createCustomer;

    if (contentType === 'company') {
      create = Companies.createCompany;
    }

    // Iterating field values
    for (const fieldValue of result) {
      const inc: { success: number; failed: number; percentage: number } = {
        success: 0,
        failed: 0,
        percentage: percentagePerData,
      };

      const push: { ids?: string; errorMsgs?: string } = {};

      const coc: any = {
        customFieldsData: {},
      };

      let colIndex = 0;

      // Iterating through detailed properties
      for (const property of properties) {
        // Checking if it is basic info field
        if (property.isCustomField === false) {
          coc[property.name] = fieldValue[colIndex];
        } else {
          coc.customFieldsData[property.id] = fieldValue[colIndex];
        }

        colIndex++;
      }

      // Creating coc
      await create(coc, user)
        .then(cocObj => {
          inc.success++;
          // Increasing success count
          push.ids = cocObj._id;
        })
        .catch(e => {
          inc.failed++;
          // Increasing failed count and pushing into error message

          switch (e.message) {
            case 'Duplicated email':
              push.errorMsgs = `Duplicated email ${coc.primaryEmail}`;
              break;
            case 'Duplicated phone':
              push.errorMsgs = `Duplicated phone ${coc.primaryPhone}`;
              break;
            case 'Duplicated name':
              push.errorMsgs = `Duplicated name ${coc.primaryName}`;
              break;
            default:
              push.errorMsgs = e.message;
              break;
          }
        });

      await ImportHistory.updateOne({ _id: importHistoryId }, { $inc: inc, $push: push });

      let importHistory = await ImportHistory.findOne({ _id: importHistoryId });

      if (!importHistory) {
        throw new Error('Could not find import history');
      }

      if (importHistory.failed + importHistory.success === importHistory.total) {
        await ImportHistory.updateOne({ _id: importHistoryId }, { $set: { status: 'Done' } });

        importHistory = await ImportHistory.findOne({ _id: importHistoryId });
      }

      if (!importHistory) {
        throw new Error('Could not find import history');
      }

      pubsub.publish('importHistoryChanged', {
        importHistoryChanged: {
          _id: importHistory._id,
          status: importHistory.status,
          percentage: importHistory.percentage,
        },
      });
    }

    mongoose.connection.close();

    parentPort.postMessage('Successfully finished job');
  },
);