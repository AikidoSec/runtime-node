import * as t from "tap";
import { isPrivateHostname } from "./isPrivateHostname";

const publicIPs = [
  "44.37.112.180",
  "46.192.247.73",
  "71.12.102.112",
  "101.0.26.90",
  "111.211.73.40",
  "156.238.194.84",
  "164.101.185.82",
  "223.231.138.242",
  "226.84.185.150",
  "227.202.96.196",
  "::1fff:0.0.0.0",
  "::1fff:10.0.0.0",
  "::1fff:0:0.0.0.0",
  "::1fff:0:10.0.0.0",
  "2001:2:ffff:ffff:ffff:ffff:ffff:ffff",
  "64:ff9a::0.0.0.0",
  "64:ff9a::255.255.255.255",
  "99::",
  "99::ffff:ffff:ffff:ffff",
  "101::",
  "101::ffff:ffff:ffff:ffff",
  "2000::",
  "2000::ffff:ffff:ffff:ffff:ffff:ffff",
  "2001:10::",
  "2001:1f:ffff:ffff:ffff:ffff:ffff:ffff",
  "2001:db7::",
  "2001:db7:ffff:ffff:ffff:ffff:ffff:ffff",
  "2001:db9::",
  "fb00::",
  "fbff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
  "fec0::",
];

const privateIPs = [
  "0.0.0.0",
  "0000.0000.0000.0000",
  "0000.0000",
  "0.0.0.1",
  "0.0.0.7",
  "0.0.0.255",
  "0.0.255.255",
  "0.1.255.255",
  "0.15.255.255",
  "0.63.255.255",
  "0.255.255.254",
  "0.255.255.255",
  "10.0.0.0",
  "10.0.0.1",
  "10.0.0.01",
  "10.0.0.001",
  "10.255.255.254",
  "10.255.255.255",
  "100.64.0.0",
  "100.64.0.1",
  "100.127.255.254",
  "100.127.255.255",
  "127.0.0.0",
  "127.0.0.1",
  "127.0.0.01",
  "127.1",
  "127.0.1",
  "127.000.000.1",
  "127.255.255.254",
  "127.255.255.255",
  "169.254.0.0",
  "169.254.0.1",
  "169.254.255.254",
  "169.254.255.255",
  "172.16.0.0",
  "172.16.0.1",
  "172.16.0.001",
  "172.31.255.254",
  "172.31.255.255",
  "192.0.0.0",
  "192.0.0.1",
  "192.0.0.6",
  "192.0.0.7",
  "192.0.0.8",
  "192.0.0.9",
  "192.0.0.10",
  "192.0.0.11",
  "192.0.0.170",
  "192.0.0.171",
  "192.0.0.254",
  "192.0.0.255",
  "192.0.2.0",
  "192.0.2.1",
  "192.0.2.254",
  "192.0.2.255",
  "192.31.196.0",
  "192.31.196.1",
  "192.31.196.254",
  "192.31.196.255",
  "192.52.193.0",
  "192.52.193.1",
  "192.52.193.254",
  "192.52.193.255",
  "192.88.99.0",
  "192.88.99.1",
  "192.88.99.254",
  "192.88.99.255",
  "192.168.0.0",
  "192.168.0.1",
  "192.168.255.254",
  "192.168.255.255",
  "192.175.48.0",
  "192.175.48.1",
  "192.175.48.254",
  "192.175.48.255",
  "198.18.0.0",
  "198.18.0.1",
  "198.19.255.254",
  "198.19.255.255",
  "198.51.100.0",
  "198.51.100.1",
  "198.51.100.254",
  "198.51.100.255",
  "203.0.113.0",
  "203.0.113.1",
  "203.0.113.254",
  "203.0.113.255",
  "240.0.0.0",
  "240.0.0.1",
  "255.0.0.0",
  "255.192.0.0",
  "255.240.0.0",
  "255.254.0.0",
  "255.255.0.0",
  "255.255.255.0",
  "255.255.255.248",
  "255.255.255.254",
  "255.255.255.255",
  "0000:0000:0000:0000:0000:0000:0000:0000",
  "::",
  "::1",
  "::ffff:0.0.0.0",
  "::ffff:255.255.255.255",
  "64:ff9b::0.0.0.0",
  "64:ff9b::16.10.11.1",
  "64:ff9b::255.255.255.255",
  "100::",
  "100::0:0:0:0",
  "100::1:eabc:0:2",
  "100::ffff:ffff:ffff:ffff",
  "2001::",
  "2001::a:b:c",
  "2001::ffff:ffff:ffff:ffff:ffff:ffff",
  "2001:20::",
  "2001:20::a:b:c",
  "2001:2f::a:b:c",
  "2001:2f:ffff:ffff:ffff:ffff:ffff:ffff",
  "2001:db8::",
  "2001:db8::1",
  "2001:db8:abc::1",
  "2001:db8:ffff:ffff:ffff:ffff:ffff:ffff",
  "2002::",
  "2002::1",
  "2002::abc:1",
  "2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
  "fe80::",
  "fe80::1",
  "fe80::abc:1",
  "febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
  "fc00::",
  "fc00::1",
  "fc00::abc:1",
  "fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
  "ff00::",
  "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
  "2130706433",
  "0x7f000001",

  // AWS metadata
  "fd00:ec2::254",
  "169.254.169.254",
];

const invalidIPs = [
  "100::ffff::",
  "::ffff:0.0.255.255.255",
  "::ffff:0.255.255.255.255",
];

t.test("public IPs", async (t) => {
  for (let ip of publicIPs) {
    if (ip.includes(":")) {
      ip = `[${ip}]`; // IPv6 are enclosed in brackets
    }
    t.same(isPrivateHostname(ip), false, `Expected ${ip} to be public`);
  }
});

t.test("private IPs", async (t) => {
  for (let ip of privateIPs) {
    if (ip.includes(":")) {
      ip = `[${ip}]`; // IPv6 are enclosed in brackets
    }
    t.same(isPrivateHostname(ip), true, `Expected ${ip} to be private`);
  }
});

t.test("invalid IPs", async (t) => {
  for (let ip of invalidIPs) {
    if (ip.includes(":")) {
      ip = `[${ip}]`; // IPv6 are enclosed in brackets
    }
    t.same(isPrivateHostname(ip), false, `Expected ${ip} to be invalid`);
  }
});
