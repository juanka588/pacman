// Tests for KeyboardControlAdapter

describe('KeyboardControlAdapter', () => {
    let target;
    let adapter;

    function fire(key) {
        target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }

    beforeEach(() => {
        target = document.createElement('div');
        adapter = new KeyboardControlAdapter(target);
    });

    afterEach(() => {
        adapter.destroy();
    });

    test('initial direction is {x:0, y:0}', () => {
        expect(adapter.getDirection()).toEqual({ x: 0, y: 0 });
    });

    test('ArrowRight sets direction to {x:1, y:0}', () => {
        fire('ArrowRight');
        expect(adapter.getDirection()).toEqual({ x: 1, y: 0 });
    });

    test('ArrowLeft sets direction to {x:-1, y:0}', () => {
        fire('ArrowLeft');
        expect(adapter.getDirection()).toEqual({ x: -1, y: 0 });
    });

    test('ArrowDown sets direction to {x:0, y:1}', () => {
        fire('ArrowDown');
        expect(adapter.getDirection()).toEqual({ x: 0, y: 1 });
    });

    test('ArrowUp sets direction to {x:0, y:-1}', () => {
        fire('ArrowUp');
        expect(adapter.getDirection()).toEqual({ x: 0, y: -1 });
    });

    test('unrelated keys do not change direction', () => {
        fire('ArrowRight');
        fire('Space');
        expect(adapter.getDirection()).toEqual({ x: 1, y: 0 });
    });

    test('direction changes when a new arrow is pressed', () => {
        fire('ArrowRight');
        fire('ArrowUp');
        expect(adapter.getDirection()).toEqual({ x: 0, y: -1 });
    });

    test('destroy() stops responding to key events', () => {
        fire('ArrowRight');
        adapter.destroy();
        fire('ArrowUp');
        // Should still be ArrowRight — destroy removed the listener
        expect(adapter.getDirection()).toEqual({ x: 1, y: 0 });
    });
});
