// Tests for SwipeControlAdapter

function makeTouch(x, y) {
    return { clientX: x, clientY: y };
}

function fireTouch(target, type, x, y) {
    // JSDOM supports TouchEvent with changedTouches
    const event = new TouchEvent(type, {
        changedTouches: [makeTouch(x, y)],
        bubbles: true,
    });
    target.dispatchEvent(event);
}

describe('SwipeControlAdapter', () => {
    let target;
    let adapter;

    beforeEach(() => {
        target = document.createElement('div');
        adapter = new SwipeControlAdapter(target);
    });

    afterEach(() => {
        adapter.destroy();
    });

    test('initial direction is {x:0, y:0}', () => {
        expect(adapter.getDirection()).toEqual({ x: 0, y: 0 });
    });

    test('swipe right sets direction to {x:1, y:0}', () => {
        fireTouch(target, 'touchstart', 100, 100);
        fireTouch(target, 'touchend',   150, 105);
        expect(adapter.getDirection()).toEqual({ x: 1, y: 0 });
    });

    test('swipe left sets direction to {x:-1, y:0}', () => {
        fireTouch(target, 'touchstart', 150, 100);
        fireTouch(target, 'touchend',   100, 105);
        expect(adapter.getDirection()).toEqual({ x: -1, y: 0 });
    });

    test('swipe down sets direction to {x:0, y:1}', () => {
        fireTouch(target, 'touchstart', 100, 100);
        fireTouch(target, 'touchend',   105, 150);
        expect(adapter.getDirection()).toEqual({ x: 0, y: 1 });
    });

    test('swipe up sets direction to {x:0, y:-1}', () => {
        fireTouch(target, 'touchstart', 100, 150);
        fireTouch(target, 'touchend',   105, 100);
        expect(adapter.getDirection()).toEqual({ x: 0, y: -1 });
    });

    test('tap below threshold does not change direction', () => {
        fireTouch(target, 'touchstart', 100, 100);
        fireTouch(target, 'touchend',   105, 105); // only 5px — below 15px threshold
        expect(adapter.getDirection()).toEqual({ x: 0, y: 0 });
    });

    test('destroy() stops responding to touch events', () => {
        fireTouch(target, 'touchstart', 100, 100);
        fireTouch(target, 'touchend',   150, 100);
        adapter.destroy();
        fireTouch(target, 'touchstart', 100, 100);
        fireTouch(target, 'touchend',   100, 150); // swipe down after destroy
        // Should still be right — destroy removed the listeners
        expect(adapter.getDirection()).toEqual({ x: 1, y: 0 });
    });
});
