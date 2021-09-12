function hanoi(n, start, end, other) {
  if (n === 1) {
    console.log(`${start} -> ${end}`);
    return 1;
  }
  else {
    const first = hanoi(n-1, start, other, end);
    console.log(`${start} -> ${end}`);
    const second = hanoi(n-1, other, end, start);
    return first + second + 1;
  }
}

console.log(hanoi(3, 1, 3, 2));