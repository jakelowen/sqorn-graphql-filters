module.exports = `
input StringWhere {
    eq: String
    neq: String
    in: [String]
    notIn: [String]
    lt: String
    lte: String
    gt: String
    gte: String
    contains: String
    notContains: String
    startsWith: String
    notStartsWith: String
    endsWith: String
    notEndsWith: String
}

input DateTimeWhere {
    eq: String
    neq: String
    in: [String]
    notIn: [String]
    lt: String
    lte: String
    gt: String
    gte: String
}

input DateRange {
    startDate: GraphQLDate!
    endDate: GraphQLDate!
}

input StringRange {
    start: String!
    end: String!
}

input DateRangeWhere {
    containsDate: String
    containsDateRange: DateRange
    overlapsDateRange: DateRange
}

input BooleanWhere {
    eq: Boolean!
}

`;
