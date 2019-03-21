import { requestHelper } from '../../helpers/api/v1';

const endpoint = '/user/test';
describe(`GET ${endpoint}`, () => {
  let api;
  beforeEach(async () => {
    api = requestHelper();
  });

  it('success with response', async () => {
    const response = await api.get(endpoint, null, {
      hi: 'hi'
    });
    expect(response.authenticated).to.eql(true);
  });

  it('no params', async () => {
    await expect(api.get(endpoint, null))
      .to.eventually.be.rejected.and.eql({
        code: 400,
        error: 'BadRequest',
        message: 'invalidReqParams',
      });
  });
});