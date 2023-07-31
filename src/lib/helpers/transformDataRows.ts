type TransformRules<RowType> =
{
    [key: string]: (row: RowType) => any;
};

export default function transformDataRows<RowType>(input: RowType[], rules: TransformRules<RowType>)
{
    let output = [];
    for (const row of input)
    {
        let newRow: any = {};
        for (const rule in rules)
            newRow[rule] = rules[rule](row);

        output.push(newRow);
    }
    return output;
}