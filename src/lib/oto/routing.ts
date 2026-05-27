import { Gain, getDestination } from 'tone'

const output = new Gain(1)
output.connect(getDestination())

export function getOutput() {
    return output
}
