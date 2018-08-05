import { GraderGuiPage } from './app.po';

describe('main App', () => {
  let page: GraderGuiPage;

  beforeEach(() => {
    page = new GraderGuiPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
