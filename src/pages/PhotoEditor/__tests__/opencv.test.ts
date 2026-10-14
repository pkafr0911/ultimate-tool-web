// Validate native resource ownership independently of the real-browser pixel suite.
const allocated: { delete: jest.Mock }[] = [];
let failAt = '';
class Mat {
  data = new Uint8Array([128, 64, 32, 128]);
  cols = 1;
  rows = 1;
  delete = jest.fn();
  constructor() {
    allocated.push(this);
  }
  clone() {
    return new Mat();
  }
}
jest.mock('@techstark/opencv-js', () => ({
  __esModule: true,
  default: {
    getBuildInformation: () => 'test',
    Mat,
    Size: class {},
    imread: () => new Mat(),
    cvtColor: (_source: Mat, mask: Mat) => {
      mask.data = new Uint8Array([255]);
    },
    threshold: () => {},
    GaussianBlur: () => {
      if (failAt === 'blur') throw new Error('native blur failed');
    },
    imshow: () => {
      if (failAt === 'render') throw new Error('native render failed');
    },
  },
}));
jest.mock('../workers/imageProcessingService', () => ({ imageProcessingService: {} }));
const { loadOpenCv, applyBlurWithMask } = require('../utils/opencvHelpers');
beforeEach(() => {
  allocated.length = 0;
  failAt = '';
});
test.each(['', 'blur', 'render'])(
  'OpenCV releases all allocated matrices on %s outcome',
  async (failure) => {
    await loadOpenCv();
    failAt = failure;
    const source = document.createElement('canvas');
    source.width = source.height = 1;
    const result = applyBlurWithMask(source, source, 3, 0);
    if (failure) await expect(result).rejects.toThrow('native');
    else await expect(result).resolves.toMatchObject({ width: 1, height: 1 });
    expect(allocated.length).toBeGreaterThanOrEqual(3);
    allocated.forEach((mat) => expect(mat.delete).toHaveBeenCalledTimes(1));
  },
);
