import * as moment from 'moment';
import dealInsightQueries from '../data/resolvers/queries/insights/dealInsights';
import { graphqlRequest } from '../db/connection';
import { dealBoardFactory, dealFactory, dealPipelineFactory, dealStageFactory, userFactory } from '../db/factories';
import { DealBoards, DealPipelines, Deals, DealStages } from '../db/models';

describe('dealInsightQueries', () => {
  let board;
  let pipeline;
  let stage;
  let deal;
  let doc;

  const endDate = new Date(
    moment(new Date())
      .add(1, 'days')
      .toString(),
  ).toISOString();

  const startDate = new Date(
    moment(endDate)
      .add(-7, 'days')
      .toString(),
  ).toISOString();

  beforeEach(async () => {
    // creating test data
    board = await dealBoardFactory();
    pipeline = await dealPipelineFactory({ boardId: board._id });
    stage = await dealStageFactory({ pipelineId: pipeline._id });
    deal = await dealFactory({ stageId: stage._id });

    doc = {
      pipelineIds: pipeline._id,
      boardId: board._id,
      startDate,
      endDate,
    };
  });

  afterEach(async () => {
    // Clearing test data
    await DealBoards.deleteMany({});
    await DealPipelines.deleteMany({});
    await DealStages.deleteMany({});
    await Deals.deleteMany({});
  });

  test(`test if Error('Login required') exception is working as intended`, async () => {
    expect.assertions(3);

    const expectError = async func => {
      try {
        await func(null, {}, {});
      } catch (e) {
        expect(e.message).toBe('Login required');
      }
    };

    expectError(dealInsightQueries.dealInsightsPunchCard);
    expectError(dealInsightQueries.dealInsightsMain);
    expectError(dealInsightQueries.dealInsightsByTeamMember);
  });

  test('dealInsightsPunchCard', async () => {
    const qry = `
      query dealInsightsPunchCard(
        $pipelineIds: String,
        $boardId: String,
        $startDate: String,
        $endDate: String
        ) {
        dealInsightsPunchCard(
          pipelineIds: $pipelineIds,
          boardId: $boardId,
          startDate: $startDate,
          endDate: $endDate
        )
      }
    `;

    const response = await graphqlRequest(qry, 'dealInsightsPunchCard', doc);
    expect(response.length).toBe(1);
  });

  test('dealInsightsByTeamMember', async () => {
    const user = await userFactory({});

    Deals.findByIdAndUpdate(deal._id, {
      modifiedAt: new Date(),
      modifiedBy: user._id,
    });

    const qry = `
      query dealInsightsByTeamMember(
        $pipelineIds: String,
        $boardId: String,
        $startDate: String,
        $endDate: String
        ) {
        dealInsightsByTeamMember(
          pipelineIds: $pipelineIds,
          boardId: $boardId,
          startDate: $startDate,
          endDate: $endDate)
      }
    `;

    const response = await graphqlRequest(qry, 'dealInsightsByTeamMember', doc);
    expect(response.length).toBe(1);
  });
});
