const bufferStuff = require("./bufferStuff.js");
const fs = require("fs");

const Vec2 = require("./vectorStuff.js").Vec2;

class Chunk {
	constructor(chunkID, chunkSize) {
		this.chunkID = chunkID;
		this.chunkSize = chunkSize;
	}
}

let Environment = {
	Stadium: 0,
	Canyon: 1,
	Valley: 2,
	Lagoon: 3,
	Storm: 4,

	Unknown: -1,
}

let Decoration = {
	Stadium: 0,
	Canyon: 1,
	Valley: 2,
	Lagoon: 3,
	Storm: 4,

	Unknown: -1,
}

let MapType = {
	Race: 0,
	Platform: 1,
	Puzzle: 2,
	Crazy: 3,
	Shortcut: 4,
	Stunts: 5,
	Script: 6,

	Unknown: -1
}

let Mode = {
	EndMarker: 0,
	Campaign: 1,
	Puzzle: 2,
	Retro: 3,
	TimeAttack: 4,
	Rounds: 5,
	InProgress: 6,
	Multi: 7,
	Solo: 8,
	Site: 9,
	SoloNadeo: 10,
	MultiNadeo: 12,

	Unknown: -1,
}

let Mood = {
	Day: 0,
	Sunrise: 1,
	Sunset: 2,
	Night: 3,
	Night: 4,

	Unknown: -1,
}

class TmDesc {
	constructor(buff = new bufferStuff.Reader, version = 0) {
		this.version = buff.readUByte();
		// TODO: Version 3 check

		buff.readBool();
		if (this.version >= 1) {
			this.bronzeTime = buff.readUInt();
			this.silverTime = buff.readUInt();
			this.goldTime = buff.readUInt();
			this.authorTime = buff.readUInt();
			if (this.version == 2)
				this.unknown1 = buff.readUByte();

			if (this.version >= 4) {
				this.cost = buff.readUInt();
				if (this.version >= 5) {
					this.multilap = buff.readBool();
					if (this.version == 6)
						this.unknown2 = buff.readUByte();

					if (this.version >= 7)
						this.mapType = buff.readUInt();

					if (this.version >= 9) {
						buff.readUInt();

						if (this.version >= 10) {
							this.authorScore = buff.readUInt();

							if (this.version >= 11) {
								const editor = buff.readUInt();

								this.simpleEditor = (editor & 0x1) == 1;
								this.containsGhostBlocks = (editor & 0x2) == 2;

								if (this.version >= 12) {
									buff.readBool();

									if (this.version >= 13) {
										this.checkpoints = buff.readUInt();
										this.laps = buff.readUInt();
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

function readLoopbackStrings(buff = new bufferStuff.Reader, loopbackStrings = []) {
	const index = buff.readUInt();
	if ((index & 0xc0000000) === 0) {
		const realIndex = index & 0x3fffffff;
		console.log(realIndex);
		if (realIndex === 0) {
			// idfk do fucking nothing
		} else {
			return loopbackStrings[realIndex - 1];
		}
	} else if ((index & 0x80000000) !== 0 || (index & 0x40000000) !== 0) {
		const realIndex = index & 0x3fffffff;
		if (realIndex === 0) {
			const string = buff.readString();
			loopbackStrings.push(string);
			return string;
		} else {
			return loopbackStrings[realIndex - 1];
		}
	}
}

function readMeta(buff = new bufferStuff.Reader, loopbackStrings = []) {
	if (loopbackStrings.length === 0) {
		buff.readUInt(); // Version
	}

	const meta = [];

	for (let i = 0; i < 3; i++) {
		meta.push(readLoopbackStrings(buff, loopbackStrings));
	}

	return meta;
}

class Common {
	constructor(buff = new bufferStuff.Reader) {
		this.version = buff.readUByte();

		const loopbackStrings = [];

		const meta = readMeta(buff, loopbackStrings);

		this.uid = meta[0];

		switch (meta[1]) {
			case "Stadium":
				this.environment = Environment.Stadium;
				break;
			case "Canyon":
				this.environment = Environment.Canyon;
				break;
			case "Valley":
				this.environment = Environment.Valley;
				break;
			case "Lagoon":
				this.environment = Environment.Lagoon;
				break;
			case "Storm":
				this.environment = Environment.Storm;
				break;
			default:
				this.environment = Environment.Unknown;
				break;
		}

		this.author = meta[2];

		this.name = buff.readString();

		const kind = buff.readUByte();
		switch (kind) {
			case 0:
				this.mode = Mode.EndMarker;
				break;
			case 1:
				this.mode = Mode.Campaign;
				break;
			case 2:
				this.mode = Mode.Puzzle;
				break;
			case 3:
				this.mode = Mode.Retro;
				break;
			case 4:
				this.mode = Mode.TimeAttack;
				break;
			case 5:
				this.mode = Mode.Rounds;
				break;
			case 6:
				this.mode = Mode.InProgress;
				break;
			case 7:
				this.mode = Mode.Campaign;
				break;
			case 8:
				this.mode = Mode.Multi;
				break;
			case 9:
				this.mode = Mode.Solo;
				break;
			case 10:
				this.mode = Mode.Site;
				break;
			case 11:
				this.mode = Mode.SoloNadeo;
				break;
			case 12:
				this.mode = Mode.MultiNadeo;
				break;
			default:
				this.mode = Mode.Unknown;
				break;
		}

		if (this.version >= 1) {
			this.passwordProtected = buff.readBool();
			buff.readString(); // Passwords are not used, skip

			if (this.version >= 2) {
				const meta1 = readMeta(buff, loopbackStrings);
				switch (meta1[0]) {
					case "Day":
						this.mood = Mood.Day;
						break;
					case "Sunrise":
						this.mood = Mood.Sunrise;
						break;
					case "Sunset":
						this.mood = Mood.Sunset;
						break;
					case "Night":
						this.mood = Mood.Night;
						break;
					default:
						this.mood = Mood.Unknown;
						break;
				}

				switch (meta1[1]) {
					case "Stadium":
						this.decoration = Decoration.Stadium;
						break;
					case "Canyon":
						this.decoration = Decoration.Canyon;
						break;
					case "Valley":
						this.decoration = Decoration.Valley;
						break;
					case "Lagoon":
						this.decoration = Decoration.Lagoon;
						break;
					case "Storm":
						this.decoration = Decoration.Storm;
						break;
					default:
						this.decoration = Decoration.Unknown;
						break;
				}

				this.decorationAuthor = meta1[2];

				this.mapOrigin = new Vec2(buff.readFloat(), buff.readFloat());

				if (this.version >= 4) {
					this.mapTarget = new Vec2(buff.readFloat(), buff.readFloat());

					if (this.version >= 5) {
						buff.skipUInt128();

						if (this.version >= 6) {
							this.mapType = buff.readString();
							this.mapStype = buff.readString();

							if (this.version < 8) {
								this.unknown1 = buff.readBool();
							} else if (this.version >= 8) {
								this.lightmapCacheUID = buff.readULong();

								if (this.version >= 9) {
									this.lightmapVersion = buff.readUByte();

									if (this.version >= 11) {
										this.titlePack = readLoopbackStrings(buff, loopbackStrings)
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

class Community {
	constructor(buff = new bufferStuff.Reader) {
		this.xml = buff.readString();
	}
}

function validateGbx(buff = new bufferStuff.Reader) {
	// Check if the Gbx magic is there
	return buff.readChars(3, true) == 0x716688;
}

let HeaderType = {
	"TmDesc": 0x03043002,
	"Common": 0x03043003,

}

function parseHeaders(buff = new bufferStuff.Reader) {
	const headers = {
		"version": buff.readShort(),
	};
	if (headers.version >= 3) {
		headers["format"] = buff.readChars(1) == "B" ? GbxFile.GBX_FORMAT_BINARY : GbxFile.GBX_FORMAT_TEXT;
		headers["refTableCompression"] = buff.readChars(1) == "U" ? GbxFile.GBX_UNCOMPRESSED : GbxFile.GBX_COMPRESSED;
		headers["bodyCompression"] = buff.readChars(1) == "U" ? GbxFile.GBX_UNCOMPRESSED : GbxFile.GBX_COMPRESSED;
		if (headers.version >= 4) {
			headers["unknownHeader0"] = buff.readChars(1) == "R" ? GbxFile.GBX_UNKNOWN_PARAM_R : GbxFile.GBX_UNKNOWN_PARAM_E;
		}
		headers["classID"] = buff.readUInt();
		if (headers.version >= 6) {
			headers["userDataSize"] = buff.readUInt();
			headers["headerChunkCount"] = buff.readUInt();
			const headerInfo = [];
			for (let i = 0; i < headers.headerChunkCount; i++) {
				headerInfo.push(new Chunk(
					buff.readUInt(),
					buff.readUInt()
				));
			}

			for (let header of headerInfo) {
				switch (header.chunkID) {
					case HeaderType.TmDesc:
						headers["description"] = new TmDesc(buff);
						break;
					case HeaderType.Common:
						headers["common"] = new Common(buff);
						break;
					case 0x03043005:
						// TODO: fix this
						console.log("community");
						//console.log(buff.buffer.slice(buff.offset, buff.buffer.length - buff.offset).toString())
						//headers["community"] = new Community(buff);
						break;
					case 0x03043007:
						console.log("thumbnail");
						break;
					case 0x03043008:
						console.log("author");
						break;
					default:
						console.log("bytes");
						break;
				}
			}
		}
	}

	return headers;
}

class GbxFile {
	constructor(file = "") {
		this.file = new bufferStuff.Reader(fs.readFileSync(file));

		if (!validateGbx(this.file))
			throw "File is not valid Gbx container";

		this.headers = parseHeaders(this.file);

		console.log(this.headers);
	}

	static GBX_FORMAT_TEXT = 0;
	static GBX_FORMAT_BINARY = 1;
	static GBX_UNCOMPRESSED = 0;
	static GBX_COMPRESSED = 1;
	static GBX_UNKNOWN_PARAM_R = 0;
	static GBX_UNKNOWN_PARAM_E = 1;
}

const gbx = new GbxFile("./A01-Race.Challenge.Gbx");