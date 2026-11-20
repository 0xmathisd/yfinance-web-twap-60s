
// ==UserScript==
// @name         Yahoo Finance - TWAP 60s
// @namespace    mathis.yahoo.twap
// @version      2.1.0
// @description  Live 60-second TWAP indicator for Yahoo Finance
// @match        https://finance.yahoo.com/quote/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
    "use strict";

    const WINDOW = 60_000;
    const INTERVAL = 500;

    let history = [];
    let lastPrice = null;
    let widget = null;
    let layout = null;

    const format = value => value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    function findSection() {
        return document.querySelector(
            'section[data-testid="price-statistic"]'
        ) || document.querySelector(
            '[data-testid="qsp-price"]'
        )?.closest("section");
    }

    function findPrice(section) {
        if (!section) return null;

        const candidates = [
            ...section.querySelectorAll("span.price")
        ];

        const el = candidates.find(node =>
            !node.matches(
                '[data-testid="qsp-price-change"], [data-testid="qsp-price-change-percent"]'
            ) &&
            !node.classList.contains("priceChange") &&
            !node.classList.contains("priceChangePercent") &&
            node.getClientRects().length > 0
        ) || section.querySelector('[data-testid="qsp-price"]');

        if (!el) return null;

        const price = Number(el.textContent.replace(/,/g, "").trim());

        return Number.isFinite(price) && price > 0
            ? { el, price }
            : null;
    }

    function removeWidget() {
        if (!layout) return;

        const { container, wrapper } = layout;

        if (container.isConnected && wrapper.isConnected) {
            wrapper.parentNode.insertBefore(container, wrapper);
            wrapper.remove();
        }

        widget = null;
        layout = null;
    }

    function attach(section) {
        if (layout?.section === section &&
            layout.wrapper.isConnected) return;

        removeWidget();

        const container = section.querySelector(".container");
        if (!container) return;

        const wrapper = document.createElement("div");

        wrapper.id = "mathis-twap-layout";

        wrapper.style.cssText = `
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 24px;
            width: fit-content;
            max-width: 100%;
        `;

        container.parentNode.insertBefore(wrapper, container);
        wrapper.appendChild(container);

        widget = document.createElement("div");
        widget.id = "mathis-twap-widget";

        widget.style.cssText = `
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 145px;
            padding-left: 16px;
            border-left: 1px solid #777;
            font-family: inherit;
            white-space: nowrap;
        `;

        widget.innerHTML = `
            <span style="font-size:12px;color:#888;margin-bottom:3px">
                TWAP 60s
            </span>
            <span data-twap-value style="font-size:22px;font-weight:600;color:#888">
                Warming up...
            </span>
            <span data-twap-diff style="font-size:12px;margin-top:3px;color:#888">
                Collecting data
            </span>
        `;

        wrapper.appendChild(widget);

        layout = { section, container, wrapper };
    }

    function calculate(now) {
        if (!widget || !lastPrice || !history.length) return;

        const cutoff = now - WINDOW;

        while (
            history.length > 1 &&
            history[1].time <= cutoff
        ) {
            history.shift();
        }

        const valueEl = widget.querySelector("[data-twap-value]");
        const diffEl = widget.querySelector("[data-twap-diff]");

        if (history[0].time > cutoff) {
            valueEl.textContent = "Warming up...";
            diffEl.textContent =
                `${Math.floor((now - history[0].time) / 1000)}/60 seconds`;
            return;
        }

        let weightedSum = 0;
        let duration = 0;

        for (let i = 0; i < history.length; i++) {
            const start = Math.max(history[i].time, cutoff);
            const end = Math.min(
                history[i + 1]?.time ?? now,
                now
            );

            if (end > start) {
                const dt = end - start;
                weightedSum += history[i].price * dt;
                duration += dt;
            }
        }

        if (duration < WINDOW) return;

        const twap = weightedSum / duration;
        const difference = lastPrice - twap;
        const percentage = difference / twap * 100;

        const color = difference >= 0 ? "#16a34a" : "#dc2626";

        valueEl.textContent = format(twap);
        valueEl.style.color = color;

        diffEl.style.color = color;
        diffEl.textContent =
            `${difference >= 0 ? "+" : ""}${format(difference)} ` +
            `(${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%)`;
    }

    function update() {
        const section = findSection();
        if (!section) return;

        const result = findPrice(section);
        if (!result) return;

        attach(section);

        const now = Date.now();

        if (result.price !== lastPrice) {
            history.push({
                time: now,
                price: result.price
            });

            lastPrice = result.price;
        }

        calculate(now);
    }

    setInterval(update, INTERVAL);
    update();

})();
