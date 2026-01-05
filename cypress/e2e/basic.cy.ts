describe("Demo: basic", () => {
  it("captures screenshot + interactions", () => {
    cy.visit("/?demo=basic&motion=on");
    cy.get("[data-testid=timeline]").should("be.visible");

    // A couple of small interactions so the recording is useful:
    cy.get("[data-testid=timeline-canvas]").trigger("mousemove", { clientX: 900, clientY: 260 });
    cy.wait(400);

    cy.screenshot("basic-01");

    // Wheel zoom (Ctrl modifier)
    cy.get("[data-testid=timeline-canvas]").trigger("wheel", {
      deltaY: -420,
      ctrlKey: true,
      clientX: 900,
      clientY: 260,
    });

    cy.wait(500);
    cy.screenshot("basic-02-zoomed");
  });
});
