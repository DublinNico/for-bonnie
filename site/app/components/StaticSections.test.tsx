// The three non-interactive sections: hero, "how it was made" and the dedication.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Closing from "./Closing";
import Hero from "./Hero";
import HowItWasMade from "./HowItWasMade";

describe("static sections", () => {
  it("FT-059 hero: the name, the portrait of Bonnie, the photo count and the page links", () => {
    render(<Hero photoCount={325} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bonnie");
    expect(screen.getByRole("img", { name: /Bonnie sitting on a path/ })).toHaveAttribute("src", "/hero-portrait.webp");
    expect(screen.getByText("A photomosaic · 325 photographs")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("href", "#gallery");
    expect(screen.getByRole("link", { name: /Explore the mosaic/ })).toHaveAttribute("href", "#mosaic");
  });

  it("FT-060 how it was made: the grid size, photo count and three steps in order", () => {
    render(<HowItWasMade cols={65} rows={115} photoCount={325} />);

    expect(screen.getByText("65 × 115 squares · 325 photos")).toBeInTheDocument();
    const steps = screen.getAllByRole("listitem").map((li) => li.querySelector("h3")?.textContent);
    expect(steps).toEqual(["The portrait", "The grid", "The mosaic"]);
    expect(screen.getByRole("img", { name: /one colour per square/ })).toHaveAttribute("src", "/grid.png");
  });

  it("FT-061 dedication: the words, five polaroids and the photo count", () => {
    const { container } = render(<Closing photoCount={325} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("who gave us 11 wonderful years we will never forget.");
    expect(container.querySelectorAll(".polaroid img")).toHaveLength(5);
    expect(screen.getByText("Made from 325 photographs, with love.")).toBeInTheDocument();
  });
});
