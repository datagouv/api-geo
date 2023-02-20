# BENCHMARK

## Search speed calls

```
npm run bench
```


## Functions calls memory consumption

From <https://nodejs.org/en/docs/guides/diagnostics-flamegraph/>

```
npm i -g stackvis
```

```bash
perf record -e cycles:u -g -- node --perf-basic-prof --max_old_space_size=2048 server.js
perf script >| perfs.out
sed -i \
  -e "/( __libc_start| LazyCompile | v8::internal::| Builtin:| Stub:| LoadIC:|\[unknown\]| LoadPolymorphicIC:)/d" \
  -e 's/ LazyCompile:[*~]\?/ /' \
  perfs.out
stackvis perf < perfs.out >| flamegraph.htm

## Test API under load

### Generate some input data to provide for tests

```bash
echo "code,nom" >| communes.csv
# All communes
jq -c -r '.[] |  select( .type == "commune-actuelle") | [.code, .nom] | @csv' ../data/communes.json >> communes.csv
# To use only some communes to speedup benchmark
# jq -c -r '.[] |  select( .type == "commune-actuelle") | [.code, .nom] | @csv' ../data/communes.json \
#    | shuf \
#    | head -n 100 \
#    >> communes.csv
```

### Install drill (Rust based) from https://github.com/fcsonline/drill

TLDR (considering rust is installed)

```bash
cargo install drill
```

### Run tests

```bash
drill --benchmark benchmark.yml --stats
```

Monitor with `glances` or `htop` utilities to see CPU consumption
