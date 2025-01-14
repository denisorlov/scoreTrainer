(()=>{
    let testName = 'utilsTest';
    console.info(testName+': Tests started...')
    console.time(testName);

    let hn: IHashNavigator<number> = new utils.HashNavigator(true);
    hn.push(0);hn.push(1);hn.push(2);hn.push(3);hn.push(4);hn.push(5);
    console.assert(hn.index==5, 'hn.index==5');
    console.assert(hn.array.length==6, 'hn.array.length==6');

    hn.previous();hn.previous();
    console.assert(hn.index==3, 'hn.index==3');

    hn.push(44);
    console.assert(hn.index==4, 'hn.index==4');
    console.assert(hn.array.length==5, 'hn.array.length==5');

    console.timeEnd(testName);
})();
