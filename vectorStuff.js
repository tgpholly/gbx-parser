class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static(x, y) {
		return new Vec2(x, y);
	}
}

module.exports = {
	Vec2: Vec2,
}