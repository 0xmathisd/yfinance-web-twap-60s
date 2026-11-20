
// ==UserScript==
// @name         Yahoo Finance - TWAP 60s
// @namespace    mathis.yahoo.twap
// @version      2.3.0
// @description  Live rolling 60-second TWAP indicator
// @match        https://finance.yahoo.com/quote/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
    "use strict";

    if (window.__mathisTwap?.stop) {
        window.__mathisTwap.stop();
    }

    const WINDOW = 60_000;
    const POLL = 250;
    const ID = "mathis-live-twap";

    let history = [];
    let lastPrice = null;
    let interval = null;
    let observer = null;
    let updatePending = false;

    const format = value => value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    function getElements() {
        const price = document.querySelector(
            '[data-testid="qsp-price"]'
        );

        if (!price) return null;

        const section = price.closest(
            '[data-testid="price-statistic"]'
        ) || price.closest("section");

        const container = price.closest(".container");

        if (!section || !container) return null;

        const value = Number(
            price.textContent.replace(/,/g, "").trim()
        );

        if (!Number.isFinite(value) || value <= 0) {
            return null;
        }

        return { section, container, price, value };
    }

    function createWidget() {
        const widget = document.createElement("div");
        widget.id = ID;


        widget.style.cssText = `
    display: inline-flex !important;
    flex: 0 0 auto !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-self: center !important;
    position: relative !important;
    min-width: 145px !important;
    margin-left: 18px !important;
    padding-left: 16px !important;
    border-left: none !important;
    white-space: nowrap !important;
    font-family: inherit !important;
    line-height: 1.4 !important;
    box-sizing: border-box !important;
`;

        widget.style.setProperty("--twap-separator", "#777");
        widget.style.setProperty("isolation", "isolate");
        widget.style.setProperty("border-left", "none", "important");

        widget.insertAdjacentHTML("afterbegin", `
    <span style="
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 1px;
        height: 34px;
        background: var(--twap-separator);
        pointer-events: none;
    "></span>
`);


        widget.innerHTML = `
            <span style="font-size:12px;color:#888;padding-top:20px">
                TWAP 60s
            </span>
            <span data-value style="
                font-size:22px;
                font-weight:600;
                color:#888;
            ">Warming up...</span>
            <span data-diff style="
                font-size:12px;
                color:#888;
            ">0 / 60 seconds</span>
        `;

        return widget;
    }

    function attach(container) {
        let widget = document.getElementById(ID);

        if (!widget) {
            widget = createWidget();
        }

        // Insert inside Yahoo's price container,
        // after price, absolute change and percentage.
        if (widget.parentElement !== container) {
            container.appendChild(widget);
        }

        // Keep the native price statistics on one row.
        container.style.setProperty(
            "display", "flex", "important"
        );
        container.style.setProperty(
            "align-items", "center", "important"
        );
        container.style.setProperty(
            "flex-wrap", "nowrap", "important"
        );

        return widget;
    }

    function calculate(now, widget) {
        const cutoff = now - WINDOW;

        while (
            history.length > 1 &&
            history[1].time <= cutoff
        ) {
            history.shift();
        }

        const output = widget.querySelector("[data-value]");
        const diffOutput = widget.querySelector("[data-diff]");

        if (!history.length) return;

        if (history[0].time > cutoff) {
            const elapsed = Math.floor(
                (now - history[0].time) / 1000
            );

            output.textContent = "Warming up...";
            output.style.color = "#888";
            diffOutput.textContent = `${elapsed} / 60 seconds`;
            diffOutput.style.color = "#888";
            return;
        }

        let weightedSum = 0;
        let duration = 0;

        for (let i = 0; i < history.length; i++) {
            const start = Math.max(
                history[i].time,
                cutoff
            );

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

        const color = difference >= 0
            ? "#16a34a"
            : "#dc2626";

        output.textContent = format(twap);
        output.style.color = color;

        diffOutput.textContent =
            `${difference >= 0 ? "+" : ""}${format(difference)} ` +
            `(${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%)`;

        diffOutput.style.color = color;
    }

    function update() {
        const elements = getElements();

        if (!elements) return;

        const { container, value } = elements;
        const now = Date.now();

        const widget = attach(container);

        if (value !== lastPrice) {
            history.push({
                time: now,
                price: value
            });

            lastPrice = value;
        }

        calculate(now, widget);
    }

    function scheduleUpdate() {
        if (updatePending) return;

        updatePending = true;

        requestAnimationFrame(() => {
            updatePending = false;
            update();
        });
    }

    observer = new MutationObserver(scheduleUpdate);

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    interval = setInterval(update, POLL);

    update();

    window.__mathisTwap = {
        stop() {
            clearInterval(interval);
            observer.disconnect();
            document.getElementById(ID)?.remove();
            history = [];
            lastPrice = null;
            delete window.__mathisTwap;
        }
    };
})();
