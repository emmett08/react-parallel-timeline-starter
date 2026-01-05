describe("Demo: big (virtualised lanes)", () => {
  it("scrolls and captures", () => {
    cy.visit("/?demo=big&motion=off");
    cy.get("[data-testid=timeline]").should("be.visible");

    cy.screenshot("big-01-top");

    cy.get("[data-testid=timeline-scroll]").scrollTo("bottom", { duration: 800 });
    cy.wait(300);
    cy.screenshot("big-02-bottom");
  });
});
