import { SPWorlds } from 'spworlds';

export const sp = new SPWorlds({
    id: process.env.SPWORLDS_ID!,
    token: process.env.SPWORLDS_TOKEN!
});
