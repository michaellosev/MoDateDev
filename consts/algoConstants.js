export const G = "its got a good chance"
export const LG = "one sided match"
export const B = "often listed as an ideal match"
export const Y = "it could work but not ideal"
export const R = "uh oh, think this one through"

export const MYERSBRIGGS = [
    [G, G, G, B, G, B, G, G, R, R, R, R, R, R, R, R],
    [G, G, B, G, B, G, G, G, R, R, R, R, R, R, R, R],
    [G, B, G, G, G, G, G, B, R, R, R, R, R, R, R, R],
    [B, G, G, G, G, G, G, G, B, R, R, R, R, R, R, R],
    [G, B, G, G, G, G, G, B, LG, LG, LG, LG, Y, Y, Y, Y],
    [B, G, G, G, G, G, B, G, LG, LG, LG, LG, LG, LG, LG, LG],
    [G, G, G, G, G, B, G, G, LG, LG, LG, LG, Y, Y, Y, B],
    [G, G, B, G, B, G, G, G, LG, LG, LG, LG, Y, Y, Y, Y],
    [R, R, R, B, LG, LG, LG, LG, Y, Y, Y, Y, LG, B, LG, B],
    [R, R, R, R, LG, LG, LG, LG, Y, Y, Y, Y, B, LG, B, LG],
    [R, R, R, R, LG, LG, LG, LG, Y, Y, Y, Y, LG, B, LG, B],
    [R, R, R, R, LG, LG, LG, LG, Y, Y, Y, Y, B, LG, B, LG],
    [R, R, R, R, Y, LG, Y, Y, LG, B, LG, B, G, G, G, G],
    [R, R, R, R, Y, LG, Y, Y, B, LG, B, LG, G, G, G, G],
    [R, R, R, R, Y, LG, Y, Y, LG, B, LG, B, G, G, G, G],
    [R, R, R, R, Y, LG, B, Y, B, LG, B, LG, G, G, G, G]
]

export const LEGEND = {
    INFP: 0,
    ENFP: 1,
    INFJ: 2,
    ENFJ: 3,
    INTJ: 4,
    ENTJ: 5,
    INTP: 6,
    ENTP: 7,
    ISFP: 8,
    ESFP: 9,
    ISTP: 10,
    ESTP: 11,
    ISFJ: 12,
    ESFJ: 13,
    ISTJ: 14,
    ESTJ: 15
}

export const RANKING = {
    "uh oh, think this one through": 1,
    "one sided match": 2,
    "it could work but not ideal": 3,
    "its got a good chance": 4,
    "often listed as an ideal match": 5
}