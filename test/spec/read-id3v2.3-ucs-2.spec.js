//     mp3-parser test suite: ID3v2.3 tag / UCS-2 encoded frames.
//     Tests run against id3v2.3-ucs-2.mp3
//     (maintained with [Kid3 ID3 Tagger](http://kid3.sourceforge.net/), version 3.0.2)
//     The specs defined herein are complementary to those in read-id3v2.3-iso-8859-1.spec.js and
//     only deal with the subset of frames that may be encoded in UCS-2 (in addition to ISO-8859-1)

//     https://github.com/biril/mp3-parser
//     Licensed and freely distributed under the MIT License
//     Copyright (c) 2013-2016 Alex Lambiris

/* jshint node:true, esversion:6 */
/* global jasmine, describe, beforeEach, it, expect */
"use strict";

const _ = require("underscore");
const util = require("../util");
const matchers = require("../matchers");

// The module under test
const mp3Parser = require("../../main");

const mp3FilePath = `${__dirname}/../data/kid3-3.0.2/id3v2.3-ucs-2.mp3`;

describe("ID3v2.3 reader run on ID3v2.3 tag with UCS2 encoded frames", () => {
    // Read the ID3v2 tag. This is done once, here, and all tests run on `capturedId3v2Tag`
    const mp3FileView = util.dataViewFromFilePath(mp3FilePath);
    const capturedId3v2Tag = mp3Parser.readId3v2Tag(mp3FileView);

    // Helper to get (an array of) all captured ID3v2 tag frames of given `id`
    const getCapturedFrames = id =>
        _(capturedId3v2Tag.frames).filter(frame => frame.header.id === id);

    // Expect that `numOfFrames` of `id` were captured. Returns an array of relevant
    //  captured frames - unless the `numOfFrames` expectation fails
    const expectCapturedFrames = (id, numOfFrames) => {
        const capturedFrames = getCapturedFrames(id);
        expect(capturedFrames.length).toBe(numOfFrames);
        return capturedFrames;
    };

    // Expect that a single (exactly one) frame of given `id` was captured. Returns the
    //  relevant frame - unless the `numOfFrames` expectation fails
    const expectSingleCapturedFrame = id => expectCapturedFrames(id, 1)[0];

    // The subset of [ID3v2 tag frames](http://id3.org/id3v2.3.0#Declared_ID3v2_frames) that
    //  may be encoded in UCS-2, along with their 'friendly names' as defined in the spec and,
    //  in certain cases, an `expected` hash which defines values to test against
    const id3v2TagFrames = {
        AENC: {
            name: "Audio encryption",
            expected: {}
        },
        APIC: {
            name: "Attached picture",
            expected: {
                frame1: {
                    mimeType: "MIME type 1",
                    pictureType: 3, // code of 'Cover (front)' picture type
                    description: "αβγ Description of the first attached picture",
                    pictureData: _.range(32)
                },
                frame2: {
                    mimeType: "MIME type 2",
                    pictureType: 4, // code of 'Cover (back)' picture type
                    description: "αβγ Description of the second attached picture",
                    pictureData: _.range(64)
                }
            }
        },
        COMM: {
            name: "Comments",
            expected: {
                withoutLang: {
                    description: "commentWithoutLang",
                    text: "αβγ This comment has an empty language field",
                    language: ""
                },
                withLang: {
                    description: "commentWithLang",
                    text: "αβγ This comment has a language field of value 'eng'",
                    language: "eng"
                },
                withHalfLang: {
                    description: "commentWithHalfLang",
                    text: "αβγ This comment has a language field of value 'en' " +
                        "(inadequate length)",
                    language: "en"
                }
            }
        },
        COMR: {
            name: "Commercial frame",
            expected: {}
        },
        ENCR: {
            name: "Encryption method registration",
            expected: {}
        },
        EQUA: {
            name: "Equalization",
            expected: {}
        },
        ETCO: {
            name: "Event timing codes",
            expected: {}
        },
        GEOB: {
            name: "General encapsulated object",
            expected: {}
        },
        GRID: {
            name: "Group identification registration",
            expected: {}
        },
        IPLS: {
            name: "Involved people list",
            expected: {
                values: [
                    "αβγ Involvement 1",
                    "αβγ Involvee 1",
                    "αβγ Involvement 2",
                    "αβγ Involvee 2",
                    "αβγ Involvement 3"
                ]
            }
        },
        LINK: {
            name: "Linked information",
            expected: {}
        },
        MCDI: {
            name: "Music CD identifier",
            expected: {}
        },
        MLLT: {
            name: "MPEG location lookup table",
            expected: {}
        },
        OWNE: {
            name: "Ownership frame",
            expected: {}
        },

        // PRIV: { name: "Private frame" },

        PCNT: {
            name: "Play counter",
            expected: {}
        },
        POPM: {
            name: "Popularimeter",
            expected: {}
        },
        POSS: {
            name: "Position synchronisation frame",
            expected: {}
        },
        RBUF: {
            name: "Recommended buffer size",
            expected: {}
        },
        RVAD: {
            name: "Relative volume adjustment",
            expected: {}
        },
        RVRB: {
            name: "Reverb",
            expected: {}
        },
        SYLT: {
            name: "Synchronized lyric/text",
            expected: {}
        },
        SYTC: {
            name: "Synchronized tempo codes",
            expected: {}
        },

        // Text information frames. For some of these (which are commented below), the standard
        //  contains specific formatting instructions. They are however T-frames and as such
        //  their content is of variable length and encoding. As a result the formatting
        //  constraints cannot be practically enforced. So we test all of them as if they could
        //  contain _any_ text in _any_ encoding. This is one of the standard's (many) weird
        //  points - why would TSIZ which is supposed to contain the "size of file in bytes,
        //  excluding ID3v2 tag" be encoded as a T-frame?? ..
        TALB: { name: "Album/Movie/Show title" },
        TBPM: { name: "BPM (beats per minute)" }, // Integer represented as a numeric string
        TCOM: { name: "Composer" },
        TCON: { name: "Content type" },
        TCOP: { name: "Copyright message" }, // Begins with a year followed by space character
        TDAT: { name: "Date" }, // Numeric string in DDMM format
        TDLY: { name: "Playlist delay" }, // Numeric string - number of ms
        TENC: { name: "Encoded by" },
        TEXT: { name: "Lyricist/Text writer" },
        TFLT: { name: "File type" },
        TIME: { name: "Time" }, // Numeric string in HHMM format
        TIT1: { name: "Content group description" },
        TIT2: { name: "Title/songname/content description" },
        TIT3: { name: "Subtitle/Description refinement" },
        TKEY: { name: "Initial key" }, // 3 chars max. A/Ab/A#/Abm/A#m
        TLAN: { name: "Language(s)" }, // Multiple ISO-639-2 lang codes
        TLEN: { name: "Length" }, // Numeric string - number of ms
        TMED: { name: "Media type" },
        TOAL: { name: "Original album/movie/show title" },
        TOFN: { name: "Original filename" },
        TOLY: { name: "Original lyricist(s)/text writer(s)" },
        TOPE: { name: "Original artist(s)/performer(s)" },
        TORY: { name: "Original release year" }, // Numeric string in YYYY format
        TOWN: { name: "File owner/licensee" },
        TPE1: { name: "Lead performer(s)/Soloist(s)" },
        TPE2: { name: "Band/orchestra/accompaniment" },
        TPE3: { name: "Conductor/performer refinement" },
        TPE4: { name: "Interpreted, remixed, or otherwise modified by" },
        TPOS: { name: "Part of a set" }, // Numeric string, with optional with '/' (e.g. 01/02)
        TPUB: { name: "Publisher" },
        TRCK: { name: "Track number/Position in set" }, // Numeric string, with optional '/'
        TRDA: { name: "Recording dates" },
        TRSN: { name: "Internet radio station name" },
        TRSO: { name: "Internet radio station owner" },
        TSIZ: { name: "Size" }, // Numeric string - Size of file in bytes, excluding ID3v2 tag
        TSRC: { name: "ISRC (international standard recording code)" }, // 12 chars
        TSSE: { name: "Software/Hardware and settings used for encoding" },
        TYER: { name: "Year" }, // Numeric string in YYYY format

        TXXX: { name: "User defined text information frame" },

        UFID: {
            name: "Unique file identifier",
            expected: {}
        },

        USER: {
            name: "Terms of use",
            expected: {
                language: "",
                text: ""
            }
        },
        USLT: {
            name: "Unsychronised lyrics/text transcription",
            expected: {
                withoutLang: {
                    description: "lyricsWithoutLang",
                    text: "αβγ This lyrics frame has an empty language field",
                    language: ""
                },
                withLang: {
                    description: "lyricsWithLang",
                    text: "αβγ This lyrics frame has a language field of value 'eng'",
                    language: "eng"
                },
                withHalfLang: {
                    description: "lyricsWithHalfLang",
                    text: "αβγ This lyrics frame has a language field of value 'en' " +
                        "(inadequate length)",
                    language: "en"
                }
            }
        },

        // WCOM: { name: "Commercial information" },
        // WCOP: { name: "Copyright/Legal information" },
        // WOAF: { name: "Official audio file webpage" },
        // WOAR: { name: "Official artist/performer webpage" },
        // WOAS: { name: "Official audio source webpage" },
        // WORS: { name: "Official internet radio station homepage" },
        // WPAY: { name: "Payment" },
        // WPUB: { name: "Publishers official webpage" },

        WXXX: { name: "User defined URL link frame" }
    };

    beforeEach(() => { jasmine.addMatchers(matchers); });

    it("should read COMM: Comments frame", () => {
        const capturedFrames = expectCapturedFrames("COMM", 3);

        // Get expected and actual comment frames, for the case of no lang-field
        const expectedFrameWithoutLang = id3v2TagFrames.COMM.expected.withoutLang;
        const framesWithoutLang = _(capturedFrames).filter(frame =>
            frame.content.description === expectedFrameWithoutLang.description);

        // Get expected and actual comment frames, for the case of lang-field present
        const expectedFrameWithLang = id3v2TagFrames.COMM.expected.withLang;
        const framesWithLang = _(capturedFrames).filter(frame =>
            frame.content.description === expectedFrameWithLang.description);

        // Get expected and actual comment frames, for the case of lang-field of inadequate
        //  length present
        const expectedFrameWithHalfLang = id3v2TagFrames.COMM.expected.withHalfLang;
        const framesWithHalfLang = _(capturedFrames).filter(frame =>
            frame.content.description === expectedFrameWithHalfLang.description);

        expect(framesWithoutLang.length).toBe(1);
        const frameWithoutLang = framesWithoutLang[0];
        expect(frameWithoutLang.content.language).toBe(expectedFrameWithoutLang.language);
        expect(frameWithoutLang.content.text).toBe(expectedFrameWithoutLang.text);

        expect(framesWithLang.length).toBe(1);
        const frameWithLang = framesWithLang[0];
        expect(frameWithLang.content.language).toBe(expectedFrameWithLang.language);
        expect(frameWithLang.content.text).toBe(expectedFrameWithLang.text);

        expect(framesWithHalfLang.length).toBe(1);
        const frameWithHalfLang = framesWithHalfLang[0];
        expect(frameWithHalfLang.content.language).toBe(expectedFrameWithHalfLang.language);
        expect(frameWithHalfLang.content.text).toBe(expectedFrameWithHalfLang.text);
    });

    // The USLT frame's structure is basically identical to the COMM's
    it("should read USLT: Unsychronised lyrics/text transcription frame", () => {
        const capturedFrames = expectCapturedFrames("USLT", 3);

        // Get expected and actual frames, for the case of no lang-field
        const expectedWithoutLang = id3v2TagFrames.USLT.expected.withoutLang;
        const framesWithoutLang = _(capturedFrames).filter(frame =>
            frame.content.description === expectedWithoutLang.description);

        // Get expected and actual frames, for the case of lang-field present
        const expectedWithLang = id3v2TagFrames.USLT.expected.withLang;
        const framesWithLang = _(capturedFrames).filter(frame =>
            frame.content.description === expectedWithLang.description);

        // Get expected and actual frames, for the case of lang-field of inadequate
        //  length present
        const expectedWithHalfLang = id3v2TagFrames.USLT.expected.withHalfLang;
        const framesWithHalfLang = _(capturedFrames).filter(frame =>
            frame.content.description === expectedWithHalfLang.description);

        expect(framesWithoutLang.length).toBe(1);
        const frameWithoutLang = framesWithoutLang[0];
        expect(frameWithoutLang.content.language).toBe(expectedWithoutLang.language);
        expect(frameWithoutLang.content.text).toBe(expectedWithoutLang.text);

        expect(framesWithLang.length).toBe(1);
        const frameWithLang = framesWithLang[0];
        expect(frameWithLang.content.language).toBe(expectedWithLang.language);
        expect(frameWithLang.content.text).toBe(expectedWithLang.text);

        expect(framesWithHalfLang.length).toBe(1);
        const frameWithHalfLang = framesWithHalfLang[0];
        expect(frameWithHalfLang.content.language).toBe(expectedWithHalfLang.language);
        expect(frameWithHalfLang.content.text).toBe(expectedWithHalfLang.text);
    });

    // Pick text-information frames only, preprocess them and test each one. For frames that
    //  don't provide an `expected` hash, their value is checked against 'αβγ {friendly name}',
    //  (where their 'friendly name' is as defined in the ID3v2 spec). This testing-policy wasn't
    //  initially used for _all of them_ as some require their value to follow certain formatting
    //  rules according to the spec. In these cases the `expected` hash used to contain such a
    //  conforming `value`. _However_ the current implementation uses this testing policy for _all_
    //  of them (see earlier comments regarding how no formatting can reasonably be enforced on
    //  T-frames)
    _.chain(id3v2TagFrames)
        .map((frame, id) => ({ id: id, name: frame.name, expected: frame.expected }))
        .filter(frame => frame.id.charAt(0) === "T" && frame.id !== "TXXX")
        .each(frame => {
            it(`should read ${frame.id}: ${frame.name}`, () => {
                const f = expectSingleCapturedFrame(frame.id);

                expect(f.content.encoding).toBe(1);
                expect(f.content.value).toBe(frame.expected ?
                    frame.expected.value : "αβγ " + frame.name);
            });
        });

    //
    it("should read TXXX: User defined text information frame", () => {
        const f = expectSingleCapturedFrame("TXXX");

        expect(f.content.encoding).toBe(1);
        expect(f.content.description).toBe("αβγ " + id3v2TagFrames.TXXX.name + " description");
        expect(f.content.value).toBe("αβγ " + id3v2TagFrames.TXXX.name);
    });

    //
    it("should read WXXX: User defined URL link frame", () => {
        const f = expectSingleCapturedFrame("WXXX");

        expect(f.content.encoding).toBe(1);
        expect(f.content.description).toBe("αβγ " + id3v2TagFrames.WXXX.name + " description");
        expect(f.content.value).toBe(id3v2TagFrames.WXXX.name);
    });

    // According to the standard, 'the body simply contains a terminated string with the
    //  involvement directly followed by a terminated string with the involvee followed by a new
    //  involvement and so on'. In the current implementation however, the frame's content is
    //  parsed as a collection of strings without attaching special meaning. There may only be one
    //  "IPLS" frame in each tag
    it("should read IPLS: Involved People List Frame", () => {
        const f = expectSingleCapturedFrame("IPLS");

        expect(f.content.encoding).toBe(1);
        expect(f.content.values[0]).toBe("αβγ Involvement 1");
        expect(f.content.values[1]).toBe("αβγ Involvee 1");
        expect(f.content.values[2]).toBe("αβγ Involvement 2");
        expect(f.content.values[3]).toBe("αβγ Involvee 2");
        expect(f.content.values[4]).toBe("αβγ Involvement 3");
    });

    //
    it("should read USER: Terms of use frame", () => {
        const f = expectSingleCapturedFrame("USER");

        expect(f.content.encoding).toBe(1);
        expect(f.content.language).toBe("eng");
        expect(f.content.text).toBe("αβγ Terms of use");
    });

    //
    it("should read APIC: Attached picture", () => {
        const capturedFrames = expectCapturedFrames("APIC", 2);

        // Note that APIC frames are differentiated by description - According to the standard,
        //  there may be several pictures attached to one file, each in their individual "APIC"
        //  frame, but only one with the same content descriptor

        // Get expected and actual frames for the case of the first APIC test frame
        const expectedFrame1 = id3v2TagFrames.APIC.expected.frame1;
        const frame1s = _(capturedFrames).filter(frame =>
            frame.content.description === expectedFrame1.description);

        // Get expected and actual frames for the case of the second APIC test frame
        const expectedFrame2 = id3v2TagFrames.APIC.expected.frame2;
        const frame2s = _(capturedFrames).filter(frame =>
            frame.content.description === expectedFrame2.description);

        expect(frame1s.length).toBe(1);
        const frame1 = frame1s[0];
        expect(frame1.content.mimeType).toBe(expectedFrame1.mimeType);
        expect(frame1.content.pictureType).toBe(expectedFrame1.pictureType);
        expect(frame1.content.pictureData).asDataViewToEqual(expectedFrame1.pictureData);

        expect(frame2s.length).toBe(1);
        const frame2 = frame2s[0];
        expect(frame2.content.mimeType).toBe(expectedFrame2.mimeType);
        expect(frame2.content.pictureType).toBe(expectedFrame2.pictureType);
        expect(frame2.content.pictureData).asDataViewToEqual(expectedFrame2.pictureData);
    });
});
